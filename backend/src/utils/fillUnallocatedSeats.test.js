const test = require("node:test");
const assert = require("node:assert/strict");
const { fillUnallocatedSeats } = require("./fillUnallocatedSeats");

function student(rollNo, courseName, section, overrides = {}) {
  return {
    rollNo,
    course: { courseName },
    section,
    specialSeatReq: false,
    specialReq: false,
    ...overrides,
  };
}

function room(specialSeatCount = 0) {
  return {
    roomNumber: "R-1",
    totalRows: 2,
    totalColumns: 2,
    specialSeatCount,
    building: { buildingName: "Building A" },
    seats: [{}, {}, {}, {}],
  };
}

function report(mode, rows, allocatedCount, studentCount = 4) {
  const header = mode === "section"
    ? "SECTION SEAT ALLOCATION - All rooms"
    : "SEAT ALLOCATION - All rooms";
  return [
    header,
    "Temporary report; allocations have not been saved to the database.",
    "",
    "Room: Building A - R-1",
    "Invigilators: Faculty (E-1)",
    `Allocated students: ${allocatedCount}`,
    ...rows.map((row, index) => `Row ${index + 1}: ${row}`),
    "",
    "========== ALLOCATION SUMMARY ==========",
    "Total Rooms Used: 1",
    `Total Students Allocated: ${allocatedCount}`,
    `Students Not Allocated: ${studentCount - allocatedCount}`,
  ].join("\n");
}

test("tries another course when the first unallocated student's course is adjacent", () => {
  const source = report("course", [
    "R1C1: BTECH (CSE) (BWU/CSE/001) | R1C2: EMPTY",
    "R2C1: EMPTY | R2C2: EMPTY",
  ], 1, 4);
  const students = [
    student("BWU/CSE/001", "BTECH (CSE)", "A"),
    student("BWU/CSE/002", "BTECH (CSE)", "A"),
    student("BWU/CSCY/001", "BTECH (CSE CYBER SECURITY)", "A"),
    student("BWU/CSCY/002", "BTECH (CSE CYBER SECURITY)", "A"),
  ];

  const result = fillUnallocatedSeats({
    report: source,
    mode: "course",
    students,
    rooms: [room()],
  });

  assert.equal(result.filledCount, 3);
  assert.equal(result.remainingUnallocated, 0);
  assert.match(result.report, /R1C2: BTECH \(CSE CYBER SECURITY\) \(BWU\/CSCY\/001\)/);
  assert.match(result.report, /R2C1: BTECH \(CSE CYBER SECURITY\) \(BWU\/CSCY\/002\)/);
  assert.match(result.report, /R2C2: BTECH \(CSE\) \(BWU\/CSE\/002\)/);
  assert.match(result.report, /Total Students Allocated: 4/);
  assert.match(result.report, /Students Not Allocated: 0/);
});

test("fills special positions only with special-seat students", () => {
  const source = report("course", [
    "R1C1: EMPTY | R1C2: BTECH (CSE) (BWU/CSE/001)",
    "R2C1: BTECH (CSE CYBER SECURITY) (BWU/CSCY/001) | R2C2: EMPTY",
  ], 2, 3);
  const students = [
    student("BWU/CSE/001", "BTECH (CSE)", "A"),
    student("BWU/CSCY/001", "BTECH (CSE CYBER SECURITY)", "A"),
    student("BWU/BTDS/001", "BTECH (DATA SCIENCE)", "A", { specialReq: true }),
  ];

  const result = fillUnallocatedSeats({
    report: source,
    mode: "course",
    students,
    rooms: [room(1)],
  });

  assert.equal(result.filledCount, 1);
  assert.match(result.report, /R1C1: BTECH \(DATA SCIENCE\) \(BWU\/BTDS\/001\) \[SPECIAL\]/);
  assert.match(result.report, /Students Not Allocated: 0/);
});

test("section mode keeps one exact course per room and avoids adjacent repeated sections", () => {
  const source = report("section", [
    "R1C1: BTECH (CSE) / Section C (BWU/CSE/001) | R1C2: EMPTY",
    "R2C1: EMPTY | R2C2: EMPTY",
  ], 1, 5);
  const students = [
    student("BWU/CSE/001", "BTECH (CSE)", "C"),
    student("BWU/CSE/002", "BTECH (CSE)", "C"),
    student("BWU/CSE/003", "BTECH (CSE)", "D"),
    student("BWU/CSE/004", "BTECH (CSE)", "E"),
    student("BWU/CSCY/001", "BTECH (CSE CYBER SECURITY)", "C"),
  ];

  const result = fillUnallocatedSeats({
    report: source,
    mode: "section",
    students,
    rooms: [room()],
  });

  assert.equal(result.filledCount, 3);
  assert.equal(result.remainingUnallocated, 1);
  assert.match(result.report, /R1C2: BTECH \(CSE\) \/ Section D \(BWU\/CSE\/003\)/);
  assert.match(result.report, /R2C1: BTECH \(CSE\) \/ Section E \(BWU\/CSE\/004\)/);
  assert.match(result.report, /R2C2: BTECH \(CSE\) \/ Section C \(BWU\/CSE\/002\)/);
  assert.doesNotMatch(result.report, /BWU\/CSCY\/001/);
});

test("rejects reports that already duplicate a student's roll number", () => {
  const source = report("course", [
    "R1C1: BTECH (CSE) (BWU/CSE/001) | R1C2: BTECH (CSE) (BWU/CSE/001)",
    "R2C1: EMPTY | R2C2: EMPTY",
  ], 2);

  assert.throws(
    () => fillUnallocatedSeats({
      report: source,
      mode: "course",
      students: [student("BWU/CSE/001", "BTECH (CSE)", "A")],
      rooms: [room()],
    }),
    { code: "INVALID_ALLOCATION_REPORT" }
  );
});
