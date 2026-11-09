
const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function readTxtFile(filePath) {
  const cleanPath = filePath.trim().replace(/^["']|["']$/g, "");
  const absolutePath = path.resolve(cleanPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  return fs.readFileSync(absolutePath, "utf8")
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#"));
}

function parseBoolean(value, field) {
  const normalized = value.trim().toLowerCase();

  if (normalized === "true") return true;
  if (normalized === "false") return false;

  throw new Error(`${field} must be true or false`);
}

// -------------------------------------
// GENERATE NEXT ROLL NUMBER
// -------------------------------------

async function getNextRollNumber(tx, course) {
  const existingStudents = await tx.student.findMany({
    where: { courseId: course.id },
    select: { rollNo: true },
  });

  let maxNumber = 0;
  let prefix = null;

  for (const student of existingStudents) {
    const match = student.rollNo.match(
      /^(BWU\/.+\/\d{2}\/)(\d+)$/
    );

    if (!match) continue;

    const number = Number(match[2]);

    if (number > maxNumber) {
      maxNumber = number;
      prefix = match[1];
    }
  }

  // Fallback for a course with no existing students
  if (!prefix) {
    const shortCode = course.courseCode || course.courseName
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase();

    prefix = `BWU/${shortCode}/25/`;
  }

  return {
    prefix,
    nextNumber: maxNumber + 1,
  };
}

// -------------------------------------
// STUDENT IMPORT
// -------------------------------------


async function importStudents(filePath) {
  const lines = readTxtFile(filePath);

  const BATCH_SIZE = 100;
  let imported = 0;

  console.log(`Preparing ${lines.length} student records...`);

  // Fetch existing STUDENT role
  const studentRole = await prisma.role.findUnique({
    where: { roleName: "STUDENT" },
  });

  if (!studentRole) {
    throw new Error("STUDENT role not found");
  }

  // Fetch all courses once
  const courses = await prisma.course.findMany();

  const courseMap = new Map(
    courses.map(course => [course.courseName, course])
  );

  // Fetch existing roll numbers once
  const existingStudents = await prisma.student.findMany({
    select: {
      rollNo: true,
      courseId: true,
    },
  });

  // Calculate next roll number for every course
  const rollCounters = new Map();

  for (const course of courses) {
    let maxNumber = 0;
    let prefix = null;

    for (const student of existingStudents) {
      if (student.courseId !== course.id) continue;

      const match = student.rollNo.match(
        /^(BWU\/.+\/\d{2}\/)(\d+)$/
      );

      if (!match) continue;

      const number = Number(match[2]);

      if (number > maxNumber) {
        maxNumber = number;
        prefix = match[1];
      }
    }

    if (!prefix) {
      const shortCode = course.courseCode ||
        course.courseName
          .replace(/[^A-Za-z0-9]/g, "")
          .toUpperCase();

      prefix = `BWU/${shortCode}/25/`;
    }

    rollCounters.set(course.id, {
      prefix,
      nextNumber: maxNumber + 1,
    });
  }

  // Check existing emails
  const existingUsers = await prisma.user.findMany({
    select: { email: true },
  });

  const emailSet = new Set(
    existingUsers.map(user => user.email.toLowerCase())
  );

  const fileEmails = new Set();

  // Validate and prepare records
  const records = [];

  for (let i = 0; i < lines.length; i++) {
    const fields = lines[i].split("|").map(v => v.trim());

    if (fields.length !== 8) {
      throw new Error(`Line ${i + 1}: Expected 8 fields`);
    }

    const [
      fullName,
      email,
      section,
      semesterValue,
      courseName,
      plainPassword,
      specialReqValue,
      specialSeatReqValue,
    ] = fields;

    if (
      !fullName || !email || !section ||
      !semesterValue || !courseName || !plainPassword
    ) {
      throw new Error(`Line ${i + 1}: Missing required data`);
    }

    const semester = Number(semesterValue);

    if (!Number.isInteger(semester) || semester < 1) {
      throw new Error(`Line ${i + 1}: Invalid semester`);
    }

    const course = courseMap.get(courseName);

    if (!course) {
      throw new Error(
        `Line ${i + 1}: Course "${courseName}" not found`
      );
    }

    if (
      course.totalSemesters &&
      semester > course.totalSemesters
    ) {
      throw new Error(
        `Line ${i + 1}: Invalid semester for ${courseName}`
      );
    }

    const emailKey = email.toLowerCase();

    if (emailSet.has(emailKey) || fileEmails.has(emailKey)) {
      throw new Error(
        `Line ${i + 1}: Duplicate email ${email}`
      );
    }

    fileEmails.add(emailKey);

    const counter = rollCounters.get(course.id);

    const rollNo =
      counter.prefix +
      String(counter.nextNumber).padStart(3, "0");

    counter.nextNumber++;

    records.push({
      rollNo,
      fullName,
      email,
      section,
      semester,
      courseId: course.id,
      plainPassword,
      specialReq: parseBoolean(
        specialReqValue, "specialReq"
      ),
      specialSeatReq: parseBoolean(
        specialSeatReqValue, "specialSeatReq"
      ),
    });
  }

  console.log("Validation completed.");
  console.log(`Total records: ${records.length}`);
  console.log("Starting batch import...");

  // Import in batches
  for (
    let start = 0;
    start < records.length;
    start += BATCH_SIZE
  ) {
    const batch = records.slice(
      start,
      start + BATCH_SIZE
    );

    // Generate hashes outside the transaction
    const studentData = await Promise.all(
      batch.map(async student => ({
        rollNo: student.rollNo,
        fullName: student.fullName,
        password: await bcrypt.hash(
          student.plainPassword,
          10
        ),
        section: student.section,
        semester: student.semester,
        specialReq: student.specialReq,
        specialSeatReq: student.specialSeatReq,
        courseId: student.courseId,
      }))
    );

    const userData = batch.map(student => ({
      email: student.email,
      passwordHash: null,
      roleId: studentRole.id,
      studentRollNo: student.rollNo,
      isActive: true,
    }));

    // Insert both tables in one short transaction
    await prisma.$transaction(
      async tx => {
        await tx.student.createMany({
          data: studentData,
        });

        await tx.user.createMany({
          data: userData,
        });
      },
      {
        maxWait: 10000,
        timeout: 60000,
      }
    );

    imported += batch.length;

    console.log(
      `Imported ${imported} / ${records.length} students`
    );
  }

  console.log("\nStudent import completed successfully!");
  console.log(`Students imported: ${imported}`);
  console.log(`User accounts created: ${imported}`);
}


// -------------------------------------
// ROOM IMPORT
// -------------------------------------



async function importRooms(filePath) {
  const lines = readTxtFile(filePath);

  const BATCH_SIZE = 10;

  let roomCount = 0;
  let seatCount = 0;
  let skippedCount = 0;

  const buildings = await prisma.building.findMany();

  const buildingMap = new Map(
    buildings.map(building => [building.buildingCode, building])
  );

  const roomsToImport = [];
  const seenRooms = new Set();

  // STEP 1: Validate TXT records
  for (let i = 0; i < lines.length; i++) {
    const fields = lines[i].split("|").map(v => v.trim());

    if (fields.length !== 5) {
      throw new Error(`Line ${i + 1}: Expected 5 fields`);
    }

    const [
      buildingCode,
      roomNumber,
      rowsValue,
      columnsValue,
      specialSeatsValue
    ] = fields;

    const rows = Number(rowsValue);
    const columns = Number(columnsValue);
    const specialSeatCount = Number(specialSeatsValue);

    if (!buildingCode || !roomNumber) {
      throw new Error(`Line ${i + 1}: Missing building code or room number`);
    }

    if (
      !Number.isInteger(rows) || rows <= 0 ||
      !Number.isInteger(columns) || columns <= 0
    ) {
      throw new Error(`Line ${i + 1}: Invalid rows or columns`);
    }

    if (
      !Number.isInteger(specialSeatCount) ||
      specialSeatCount < 0 ||
      specialSeatCount > rows * columns
    ) {
      throw new Error(`Line ${i + 1}: Invalid special seat count`);
    }

    const building = buildingMap.get(buildingCode);

    if (!building) {
      throw new Error(`Line ${i + 1}: Building ${buildingCode} not found`);
    }

    const roomKey = `${building.id}-${roomNumber}`;

    // Skip duplicate entries inside TXT
    if (seenRooms.has(roomKey)) {
      console.log(`Skipping duplicate TXT entry: ${buildingCode} - ${roomNumber}`);
      skippedCount++;
      continue;
    }

    seenRooms.add(roomKey);

    roomsToImport.push({
      buildingId: building.id,
      buildingCode,
      roomNumber,
      rows,
      columns,
      specialSeatCount
    });
  }

  // STEP 2: Find existing rooms in database
  const existingRooms = await prisma.room.findMany({
    where: {
      OR: roomsToImport.map(room => ({
        buildingId: room.buildingId,
        roomNumber: room.roomNumber
      }))
    },
    select: {
      buildingId: true,
      roomNumber: true
    }
  });

  const existingRoomKeys = new Set(
    existingRooms.map(room => `${room.buildingId}-${room.roomNumber}`)
  );

  // STEP 3: Keep only new rooms
  const newRoomsToImport = roomsToImport.filter(room => {
    const roomKey = `${room.buildingId}-${room.roomNumber}`;

    if (existingRoomKeys.has(roomKey)) {
      console.log(`Skipping existing room: ${room.buildingCode} - ${room.roomNumber}`);
      skippedCount++;
      return false;
    }

    return true;
  });

  console.log("\n========== ROOM IMPORT STARTED ==========");
  console.log(`Total unique rooms in TXT: ${roomsToImport.length}`);
  console.log(`Existing/duplicate rooms skipped: ${skippedCount}`);
  console.log(`New rooms to import: ${newRoomsToImport.length}`);

  // STEP 4: Import only new rooms in batches
  for (
    let start = 0;
    start < newRoomsToImport.length;
    start += BATCH_SIZE
  ) {
    const batch = newRoomsToImport.slice(start, start + BATCH_SIZE);

    let batchSeats = 0;

    await prisma.$transaction(
      async tx => {
        for (const roomData of batch) {
          const room = await tx.room.create({
            data: {
              roomNumber: roomData.roomNumber,
              totalRows: roomData.rows,
              totalColumns: roomData.columns,
              specialSeatCount: roomData.specialSeatCount,
              buildingId: roomData.buildingId
            }
          });

          const seats = [];

          for (let row = 1; row <= roomData.rows; row++) {
            for (let column = 1; column <= roomData.columns; column++) {
              seats.push({
                seatNumber: (row - 1) * roomData.columns + column,
                rowNumber: row,
                columnNumber: column,
                roomId: room.id
              });
            }
          }

          await tx.roomSeat.createMany({
            data: seats
          });

          batchSeats += seats.length;
        }
      },
      {
        maxWait: 10000,
        timeout: 60000
      }
    );

    roomCount += batch.length;
    seatCount += batchSeats;

    console.log(
      `Imported ${roomCount}/${newRoomsToImport.length} rooms | ${seatCount} seats`
    );
  }

  console.log("\n========== ROOM IMPORT COMPLETED ==========");
  console.log(`Total unique rooms in TXT: ${roomsToImport.length}`);
  console.log(`Existing/duplicate rooms skipped: ${skippedCount}`);
  console.log(`New rooms imported: ${roomCount}`);
  console.log(`Total seats created: ${seatCount}`);
}



// -------------------------------------
// MAIN MENU
// -------------------------------------

async function main() {
  console.log("\n========== SEATWISE DATA IMPORT ==========");
  console.log("1. Import Students");
  console.log("2. Import Rooms");

  const choice = await ask("\nSelect option: ");

  if (choice !== "1" && choice !== "2") {
    throw new Error("Invalid option");
  }

  const filePath = await ask("Enter TXT file path: ");

  if (!filePath.trim().toLowerCase().endsWith(".txt")) {
    throw new Error("Please select a TXT file");
  }

  if (choice === "1") {
    await importStudents(filePath);
  } else {
    await importRooms(filePath);
  }
}

main()
  .catch(error => {
    console.error("\nIMPORT FAILED:", error.message);
    console.error("Database transaction rolled back.");
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
