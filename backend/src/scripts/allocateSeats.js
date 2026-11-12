require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs/promises');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Helper to generate physical positions and color-based course interleaving
 * matching your Python create_positions logic.
 */

function createPositions(rows, cols, capacity, specialCount, numberOfCourses) {
    const physicalPositions = [];

    // Generate physical seats in row-major order.
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            physicalPositions.push({
                row: i,
                col: j
            });
        }
    }

    const validPhysical = physicalPositions.slice(0, capacity);

    // Chessboard-based course distribution.
    const colors = {};

    if (numberOfCourses === 1) {
        colors[0] = validPhysical;
    } else {
        for (let k = 0; k < numberOfCourses; k++) {
            colors[k] = validPhysical.filter(
                pos => (pos.row + pos.col) % numberOfCourses === k
            );
        }
    }

    // Reserve special seats from the FIRST physical seat.
    const safeSpecialCount = Math.min(
        Math.max(0, specialCount),
        validPhysical.length
    );

    const specialPositionsSet = new Set();

    validPhysical
        .slice(0, safeSpecialCount)
        .forEach(pos => {
            specialPositionsSet.add(`${pos.row},${pos.col}`);
        });

    return {
        validPositions: validPhysical,
        specialPositionsSet,
        colors
    };
}



function calculateAllocation(students, positions, specialPositionsSet) {
    const eligibleStudents = students.filter(
        s => s.specialSeatReq || s.specialReq
    );

    const normalStudents = students.filter(
        s => !s.specialSeatReq && !s.specialReq
    );

    // Special seats belonging to this course's chessboard pattern.
    const availableSpecial = positions.filter(
        pos => specialPositionsSet.has(`${pos.row},${pos.col}`)
    ).length;

    // All other positions are normal seats.
    const availableNormal = positions.length - availableSpecial;

    const specialFill = Math.min(
        eligibleStudents.length,
        availableSpecial
    );

    const normalFill = Math.min(
        normalStudents.length,
        availableNormal
    );

    return {
        totalAllocated: specialFill + normalFill,
        specialFill
    };
}



function selectCourses(
    remainingCoursesMap,
    rows,
    cols,
    capacity,
    specialCount,
    maxCourses
) {
    const availableCourses = Object.keys(remainingCoursesMap)
        .filter(course => remainingCoursesMap[course].length > 0)
        .sort(
            (a, b) =>
                remainingCoursesMap[b].length -
                remainingCoursesMap[a].length
        );

    if (availableCourses.length === 0) return null;

    const selectedCourses = availableCourses.slice(0, maxCourses);
    const K = selectedCourses.length;
    const courseScores = {};

    // Generate course positions and fixed special positions.
    const {
        validPositions,
        specialPositionsSet,
        colors
    } = createPositions(
        rows,
        cols,
        capacity,
        specialCount,
        K
    );

    for (const course of selectedCourses) {
        courseScores[course] = Array.from({ length: K }, (_, colorIndex) =>
            calculateAllocation(
                remainingCoursesMap[course],
                colors[colorIndex] || [],
                specialPositionsSet
            )
        );
    }

    let bestPlan = null;
    let bestScore = [-1, -1];

    // Generate all possible course orders.
    function* permute(arr) {
        if (arr.length <= 1) {
            yield arr;
        } else {
            for (let i = 0; i < arr.length; i++) {
                const rest = [
                    ...arr.slice(0, i),
                    ...arr.slice(i + 1)
                ];

                for (const p of permute(rest)) {
                    yield [arr[i], ...p];
                }
            }
        }
    }

    for (const courseOrder of permute(selectedCourses)) {
        const coursePositions = {};

        let totalAllocated = 0;
        let totalSpecial = 0;

        courseOrder.forEach((course, colorIndex) => {
            const assignedPositions = colors[colorIndex] || [];

            coursePositions[course] = assignedPositions;

            const allocation = courseScores[course][colorIndex];

            totalAllocated += allocation.totalAllocated;
            totalSpecial += allocation.specialFill;
        });

        const score = [totalAllocated, totalSpecial];

        if (
            score[0] > bestScore[0] ||
            (
                score[0] === bestScore[0] &&
                score[1] > bestScore[1]
            )
        ) {
            bestScore = score;

            bestPlan = {
                coursePositions,
                specialPositionsSet,
                validPositions,
                score: bestScore
            };
        }
    }

    return bestPlan;
}

function selectSections(
    remainingSectionGroups,
    rows,
    cols,
    capacity,
    specialCount,
    maxSections
) {
    const sectionsByCourse = Object.create(null);

    for (const [groupKey, students] of Object.entries(remainingSectionGroups)) {
        if (students.length === 0) continue;

        const courseName = students[0].course.courseName;
        if (!sectionsByCourse[courseName]) {
            sectionsByCourse[courseName] = Object.create(null);
        }
        sectionsByCourse[courseName][groupKey] = students;
    }

    let bestPlan = null;
    for (const [courseName, sectionGroups] of Object.entries(sectionsByCourse)) {
        const plan = selectCourses(
            sectionGroups,
            rows,
            cols,
            capacity,
            specialCount,
            maxSections
        );

        if (
            plan &&
            (
                !bestPlan ||
                plan.score[0] > bestPlan.score[0] ||
                (
                    plan.score[0] === bestPlan.score[0] &&
                    plan.score[1] > bestPlan.score[1]
                )
            )
        ) {
            bestPlan = { ...plan, courseName };
        }
    }

    return bestPlan;
}



function placeStudents(
    students,
    positions,
    specialPositionsSet,
    seatsGrid,
    courseName
) {
    let remaining = [...students];
    let allocatedCount = 0;

    // 1. Allocate special students to reserved positions first.
    for (const pos of positions) {
        const posKey = `${pos.row},${pos.col}`;

        if (!specialPositionsSet.has(posKey)) continue;

        const studentIndex = remaining.findIndex(
            s => s.specialSeatReq || s.specialReq
        );

        if (studentIndex === -1) continue;

        const student = remaining.splice(studentIndex, 1)[0];

        seatsGrid[pos.row][pos.col] = {
            student,
            courseName,
            isSpecial: true
        };

        allocatedCount++;
    }

    // 2. Allocate normal students to normal positions.
    for (const pos of positions) {
        const posKey = `${pos.row},${pos.col}`;

        // Never use reserved special seats for normal students.
        if (specialPositionsSet.has(posKey)) continue;

        if (seatsGrid[pos.row][pos.col] !== null) continue;

        const studentIndex = remaining.findIndex(
            s => !s.specialSeatReq && !s.specialReq
        );

        if (studentIndex === -1) break;

        const student = remaining.splice(studentIndex, 1)[0];

        seatsGrid[pos.row][pos.col] = {
            student,
            courseName,
            isSpecial: false
        };

        allocatedCount++;
    }

    return {
        remaining,
        allocatedCount
    };
}


function validateSeating(seatsGrid, rows, cols) {
    const assignedCourses = new Set(
        seatsGrid.flat().filter(Boolean).map(seat => seat.courseName)
    );

    if (assignedCourses.size < 2) return true;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const current = seatsGrid[i][j];
            if (!current) continue;

            // Check right neighbor
            if (j + 1 < cols) {
                const neighbor = seatsGrid[i][j + 1];
                if (neighbor && neighbor.courseName === current.courseName) return false;
            }
            // Check bottom neighbor
            if (i + 1 < rows) {
                const neighbor = seatsGrid[i + 1][j];
                if (neighbor && neighbor.courseName === current.courseName) return false;
            }
        }
    }
    return true;
}

function getRoomInvigilators(availableInvigilators, roomIndex, roomNumber) {
    const firstInvigilatorIndex = (roomIndex - 1) * 2;
    const roomInvigilators = availableInvigilators.slice(
        firstInvigilatorIndex,
        firstInvigilatorIndex + 2
    );

    if (roomInvigilators.length < 2) {
        throw new Error(
            `Not enough active faculty to assign two invigilators to ${roomNumber}. ` +
            `Need ${roomIndex * 2} faculty, but only ${availableInvigilators.length} are available. ` +
            "No allocation report was generated."
        );
    }

    return roomInvigilators;
}

function groupStudentsBy(students, groupBy) {
    const studentsByGroup = Object.create(null);

    for (const student of students) {
        const courseName = student.course?.courseName;
        const sectionName = student.section?.trim();
        const groupName = groupBy === "section"
            ? courseName && sectionName
                ? JSON.stringify([courseName, sectionName])
                : null
            : courseName;

        if (!groupName) {
            throw new Error(
                `Student ${student.rollNo} has no ${groupBy === "section" ? "course or section" : "course"}. No allocation report was generated.`
            );
        }

        if (!studentsByGroup[groupName]) studentsByGroup[groupName] = [];
        studentsByGroup[groupName].push(student);
    }

    return studentsByGroup;
}

async function runSeatingAllocation(
    examId,
    maxCoursesPerRoom = 2,
    { groupBy = "course", reportFile = "seat-allocation.txt" } = {}
) {
    console.log("Fetching student and room details from PostgreSQL via Prisma...");
    const reportHeader = groupBy === "section"
        ? examId === undefined
            ? "SECTION SEAT ALLOCATION - All rooms"
            : `SECTION SEAT ALLOCATION - Exam ID: ${examId}`
        : examId === undefined
            ? "SEAT ALLOCATION - All rooms"
            : `EXAM SEAT ALLOCATION - Exam ID: ${examId}`;
    const groupLimitLabel = groupBy === "section"
        ? "Maximum sections per room"
        : "Maximum courses per room";
    const reportLines = [
        reportHeader,
        `${groupLimitLabel}: ${maxCoursesPerRoom}`,
        "Temporary report; allocations have not been saved to the database.",
        examId === undefined
            ? "Special seats are derived from students marked as requiring them."
            : "",
        ""
    ];

    // Fetch students grouped by course name
    const studentsFromDb = await prisma.student.findMany({
        include: { course: true }
    });

    const studentsByGroup = groupStudentsBy(studentsFromDb, groupBy);

    let roomsToAllocate;
    if (examId === undefined) {
        const rooms = await prisma.room.findMany({
            include: { building: true, seats: true },
            orderBy: [{ buildingId: 'asc' }, { roomNumber: 'asc' }]
        });
        roomsToAllocate = rooms.map(room => ({ room, specialSeatCount: null }));
    } else {
        const examRooms = await prisma.examRoom.findMany({
            where: { examId },
            include: {
                room: {
                    include: { building: true, seats: true }
                }
            }
        });
        if (examRooms.length === 0) {
            throw new Error(`No rooms are assigned to Exam ID ${examId}. No allocation report was generated.`);
        }
        roomsToAllocate = examRooms;
    }

    if (studentsFromDb.length === 0) {
        throw new Error("No students were found in the database. No allocation report was generated.");
    }

    const availableInvigilators = await prisma.faculty.findMany({
        where: {
            staffType: "FACULTY",
            isActive: true
        },
        select: {
            employeeId: true,
            fullName: true
        },
        orderBy: [
            { fullName: "asc" },
            { employeeId: "asc" }
        ]
    });

    let totalAllocated = 0;
    let roomsUsed = 0;

    for (const roomEntry of roomsToAllocate) {
        const room = roomEntry.room;
        const rows = room.totalRows;
        const cols = room.totalColumns;
        const capacity = room.seats.length > 0 ? room.seats.length : rows * cols;
        const specialSeatsCount = Math.min(
            Math.max(0, room.specialSeatCount || 0),
            capacity
        );

        const plan = groupBy === "section"
            ? selectSections(
                studentsByGroup,
                rows,
                cols,
                capacity,
                specialSeatsCount,
                maxCoursesPerRoom
            )
            : selectCourses(
                studentsByGroup,
                rows,
                cols,
                capacity,
                specialSeatsCount,
                maxCoursesPerRoom
            );

        if (!plan) {
            console.log("No more courses available to allocate.");
            break;
        }

        const roomInvigilators = getRoomInvigilators(
            availableInvigilators,
            roomsUsed + 1,
            room.roomNumber
        );

        // Initialize empty grid
        const seatsGrid = Array.from({ length: rows }, () => Array(cols).fill(null));
        const allocatedCounts = {};

        for (const [groupName, positions] of Object.entries(plan.courseProvider || plan.coursePositions)) {
            const { remaining, allocatedCount } = placeStudents(
                studentsByGroup[groupName],
                positions,
                plan.specialPositionsSet,
                seatsGrid,
                groupName
            );
            studentsByGroup[groupName] = remaining;
            allocatedCounts[groupName] = allocatedCount;
        }

        if (!validateSeating(seatsGrid, rows, cols)) {
            throw new Error(`Seating validation failed for Room ID: ${room.roomNumber}`);
        }

        roomsUsed++;
        let roomTotal = Object.values(allocatedCounts).reduce((a, b) => a + b, 0);
        totalAllocated += roomTotal;

        console.log(`Successfully allocated Room: ${room.roomNumber} (${roomTotal} students placed)`);
        reportLines.push(
            `Room: ${room.building.buildingName} - ${room.roomNumber}`,
            `Invigilators: ${roomInvigilators
                .map(faculty => `${faculty.fullName} (${faculty.employeeId})`)
                .join(" | ")}`,
            `Allocated students: ${roomTotal}`,
            ...seatsGrid.map((row, rowIndex) => {
                const seats = row.map((seat, colIndex) => {
                    if (!seat) return `R${rowIndex + 1}C${colIndex + 1}: EMPTY`;
                    const specialLabel = seat.isSpecial ? " [SPECIAL]" : "";
                    const groupLabel = groupBy === "section"
                        ? `${seat.student.course.courseName} / Section ${seat.student.section}`
                        : seat.courseName;
                    return `R${rowIndex + 1}C${colIndex + 1}: ${groupLabel} (${seat.student.rollNo})${specialLabel}`;
                });
                return `Row ${rowIndex + 1}: ${seats.join(" | ")}`;
            }),
            ""
        );
    }

    console.log("\n========== ALLOCATION SUMMARY ==========");
    console.log(`Total Rooms Used: ${roomsUsed}`);
    console.log(`Total Students Allocated: ${totalAllocated}`);
    const unallocatedStudents = Object.values(studentsByGroup)
        .reduce((total, students) => total + students.length, 0);
    console.log(`Students Not Allocated: ${unallocatedStudents}`);
    reportLines.push(
        "========== ALLOCATION SUMMARY ==========",
        `Total Rooms Used: ${roomsUsed}`,
        `Total Students Allocated: ${totalAllocated}`,
        `Students Not Allocated: ${unallocatedStudents}`
    );
    const reportPath = path.join(__dirname, reportFile);
    await fs.writeFile(reportPath, reportLines.join("\n"), "utf8");
    console.log(`Temporary seating report saved to: ${reportPath}`);
}

if (require.main === module) {
    let examIdInput;
    let maxCoursesPerRoom = 2;
    let argumentError = null;
    const args = process.argv.slice(2);

    for (let index = 0; index < args.length; index++) {
        const argument = args[index];
        if (argument === "--max-courses") {
            maxCoursesPerRoom = Number(args[index + 1]);
            index++;
        } else if (argument.startsWith("--max-courses=")) {
            maxCoursesPerRoom = Number(argument.slice("--max-courses=".length));
        } else if (argument.startsWith("--")) {
            argumentError = `Unknown option: ${argument}`;
            break;
        } else if (examIdInput === undefined) {
            examIdInput = argument;
        } else {
            argumentError = "Only one exam ID may be provided.";
            break;
        }
    }

    const examId = examIdInput === undefined ? undefined : Number(examIdInput);
    if (
        argumentError ||
        (examIdInput !== undefined && (!Number.isInteger(examId) || examId <= 0)) ||
        !Number.isInteger(maxCoursesPerRoom) ||
        maxCoursesPerRoom < 1 ||
        maxCoursesPerRoom > 5
    ) {
        if (argumentError) {
            console.error(argumentError);
        }
        if (!Number.isInteger(maxCoursesPerRoom) || maxCoursesPerRoom < 1 || maxCoursesPerRoom > 5) {
            console.error("Maximum courses per room must be an integer from 1 to 5.");
        }
        if (examIdInput !== undefined && (!Number.isInteger(examId) || examId <= 0)) {
            console.error("Exam ID must be a positive integer.");
        }
        console.error("Usage: node allocateSeats.js [examId] [--max-courses=1..5]");
        process.exitCode = 1;
        prisma.$disconnect().catch(error => {
            console.error("Unable to close Prisma after invalid allocation options:", error);
        });
    } else {
        runSeatingAllocation(examId, maxCoursesPerRoom)
            .catch(e => {
                console.error(e);
                process.exitCode = 1;
            })
            .finally(async () => {
                await prisma.$disconnect();
            });
    }
}

module.exports = {
    createPositions,
    selectCourses,
    selectSections,
    placeStudents,
    validateSeating,
    getRoomInvigilators,
    groupStudentsBy,
    runSeatingAllocation,
    disconnectPrisma: () => prisma.$disconnect()
};