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

            const allocation = calculateAllocation(
                remainingCoursesMap[course],
                assignedPositions,
                specialPositionsSet
            );

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
                validPositions
            };
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

async function runSeatingAllocation(examId, maxCoursesPerRoom = 2) {
    console.log("Fetching student and room details from PostgreSQL via Prisma...");
    const reportLines = [
        examId === undefined
            ? "SEAT ALLOCATION - All rooms"
            : `EXAM SEAT ALLOCATION - Exam ID: ${examId}`,
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

    const courseWithStudents = {};
    studentsFromDb.forEach(student => {
        const courseName = student.course.courseName;
        if (!courseWithStudents[courseName]) courseWithStudents[courseName] = [];
        courseWithStudents[courseName].push(student);
    });

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

        const plan = selectCourses(
            courseWithStudents,
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

        // Initialize empty grid
        const seatsGrid = Array.from({ length: rows }, () => Array(cols).fill(null));
        const allocatedCounts = {};

        for (const [courseName, positions] of Object.entries(plan.courseProvider || plan.coursePositions)) {
            const { remaining, allocatedCount } = placeStudents(
                courseWithStudents[courseName],
                positions,
                plan.specialPositionsSet,
                seatsGrid,
                courseName
            );
            courseWithStudents[courseName] = remaining;
            allocatedCounts[courseName] = allocatedCount;
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
            `Allocated students: ${roomTotal}`,
            ...seatsGrid.map((row, rowIndex) => {
                const seats = row.map((seat, colIndex) => {
                    if (!seat) return `R${rowIndex + 1}C${colIndex + 1}: EMPTY`;
                    const specialLabel = seat.isSpecial ? " [SPECIAL]" : "";
                    return `R${rowIndex + 1}C${colIndex + 1}: ${seat.courseName} (${seat.student.rollNo})${specialLabel}`;
                });
                return `Row ${rowIndex + 1}: ${seats.join(" | ")}`;
            }),
            ""
        );
    }

    console.log("\n========== ALLOCATION SUMMARY ==========");
    console.log(`Total Rooms Used: ${roomsUsed}`);
    console.log(`Total Students Allocated: ${totalAllocated}`);
    const unallocatedStudents = Object.values(courseWithStudents)
        .reduce((total, students) => total + students.length, 0);
    console.log(`Students Not Allocated: ${unallocatedStudents}`);
    reportLines.push(
        "========== ALLOCATION SUMMARY ==========",
        `Total Rooms Used: ${roomsUsed}`,
        `Total Students Allocated: ${totalAllocated}`,
        `Students Not Allocated: ${unallocatedStudents}`
    );
    const reportPath = path.join(__dirname, "seat-allocation.txt");
    await fs.writeFile(reportPath, reportLines.join("\n"), "utf8");
    console.log(`Temporary seating report saved to: ${reportPath}`);
}

if (require.main === module) {
    const examIdInput = process.argv[2];
    const examId = examIdInput === undefined ? undefined : Number(examIdInput);
    if (examIdInput !== undefined && (!Number.isInteger(examId) || examId <= 0)) {
        console.error("Exam ID must be a positive integer.");
        process.exitCode = 1;
    } else {
        runSeatingAllocation(examId)
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
    placeStudents,
    validateSeating
};