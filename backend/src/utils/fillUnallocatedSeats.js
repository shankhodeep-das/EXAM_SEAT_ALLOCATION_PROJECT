const ROOM_HEADER = /^Room:\s*(.*?)\s+-\s+(.+?)\s*$/;
const SEAT_CELL = /R(\d+)C(\d+):\s*(.*?)(?=\s+\|\s+R\d+C\d+:|$)/g;

function invalidReport(message) {
  const error = new Error(message);
  error.code = "INVALID_ALLOCATION_REPORT";
  return error;
}

function getGroupLabel(student, mode) {
  const courseName = student.course?.courseName;
  if (!courseName) return null;
  if (mode === "course") return courseName;

  const section = student.section;
  if (typeof section !== "string" || !section.trim()) return null;
  return `${courseName} / Section ${section}`;
}

function getSeatStudent(seatText) {
  const match = seatText.match(/^(.*)\s+\(([^()]*)\)(?:\s+\[SPECIAL\])?$/);
  if (!match || !match[2]) {
    throw invalidReport("An occupied seat is missing its student roll number.");
  }
  return {
    groupLabel: match[1],
    rollNo: match[2],
    isSpecial: /\s+\[SPECIAL\]$/.test(seatText),
  };
}

function parseReport(lines) {
  const rooms = [];
  let room = null;
  const allocatedRollNos = new Set();
  let occupiedCount = 0;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const roomMatch = line.match(ROOM_HEADER);
    if (roomMatch) {
      room = {
        building: roomMatch[1],
        roomNumber: roomMatch[2],
        rows: [],
        allocatedLineIndex: null,
        allocatedStudents: null,
      };
      rooms.push(room);
      continue;
    }

    if (!room) continue;

    const allocatedMatch = line.match(/^Allocated students:\s*(\d+)\s*$/);
    if (allocatedMatch) {
      if (room.allocatedLineIndex !== null) {
        throw invalidReport("A room has duplicate allocation counts.");
      }
      room.allocatedLineIndex = lineIndex;
      room.allocatedStudents = Number(allocatedMatch[1]);
      continue;
    }

    if (!/^Row\s+\d+:/i.test(line)) continue;

    const rowMatch = line.match(/^Row\s+(\d+):/i);
    const row = {
      rowNumber: Number(rowMatch[1]),
      lineIndex,
      line,
      seats: [],
    };
    const seenPositions = new Set();

    for (const match of line.matchAll(SEAT_CELL)) {
      const seatRow = Number(match[1]);
      const column = Number(match[2]);
      const seatText = match[3].trim();
      const position = `${seatRow},${column}`;
      if (seatRow !== row.rowNumber || seenPositions.has(position)) {
        throw invalidReport("A room row contains invalid or duplicate seat positions.");
      }
      seenPositions.add(position);
      const seat = { row: seatRow, column, seatText };

      if (seatText !== "EMPTY") {
        Object.assign(seat, getSeatStudent(seatText));
        if (allocatedRollNos.has(seat.rollNo)) {
          throw invalidReport("A student appears in more than one allocated seat.");
        }
        allocatedRollNos.add(seat.rollNo);
        occupiedCount += 1;
      }

      row.seats.push(seat);
    }

    if (row.seats.length === 0) {
      throw invalidReport("A room row has no readable seat positions.");
    }
    room.rows.push(row);
  }

  for (const parsedRoom of rooms) {
    if (parsedRoom.allocatedLineIndex === null || parsedRoom.rows.length === 0) {
      throw invalidReport("A room is missing its allocation count or seat rows.");
    }
    const roomSeatCount = parsedRoom.rows.reduce(
      (count, row) => count + row.seats.filter((seat) => seat.rollNo).length,
      0
    );
    if (roomSeatCount !== parsedRoom.allocatedStudents) {
      throw invalidReport("A room's allocation count does not match its occupied seats.");
    }
  }

  return { rooms, allocatedRollNos, occupiedCount };
}

function roomCapacity(room) {
  const rows = Number(room.totalRows);
  const columns = Number(room.totalColumns);
  if (!Number.isInteger(rows) || rows < 1 || !Number.isInteger(columns) || columns < 1) {
    throw invalidReport("A room has invalid row or column dimensions.");
  }

  const rectangularCapacity = rows * columns;
  const configuredCapacity = room.seats?.length || rectangularCapacity;
  return {
    rows,
    columns,
    capacity: Math.min(configuredCapacity, rectangularCapacity),
  };
}

function roomKey(building, roomNumber) {
  return `${building}\u0000${roomNumber}`;
}

function isValidPosition(row, column, columns, capacity) {
  return (row - 1) * columns + column - 1 < capacity;
}

function compareRollNumbers(left, right) {
  return left.localeCompare(right, undefined, { numeric: true });
}

function chooseUnallocatedStudent(availableByGroup, mode, courseName, adjacentGroups, special) {
  let selectedGroup = null;
  let selectedStudent = null;

  for (const [groupLabel, group] of availableByGroup) {
    if (mode === "section" && courseName && group.courseName !== courseName) continue;
    if (adjacentGroups.has(groupLabel)) continue;

    const candidate = group[special ? "special" : "regular"][0];
    if (candidate && (!selectedStudent || compareRollNumbers(candidate.rollNo, selectedStudent.rollNo) < 0)) {
      selectedGroup = groupLabel;
      selectedStudent = candidate;
    }
  }

  if (!selectedStudent) return null;
  availableByGroup.get(selectedGroup)[special ? "special" : "regular"].shift();
  return { student: selectedStudent, groupLabel: selectedGroup };
}

function fillUnallocatedSeats({ report, mode, students, rooms: databaseRooms }) {
  if (!["course", "section"].includes(mode)) {
    throw new TypeError("Allocation mode must be course or section.");
  }

  const lines = report.split(/\r?\n/);
  const expectedHeader = mode === "section"
    ? "SECTION SEAT ALLOCATION - All rooms"
    : "SEAT ALLOCATION - All rooms";
  if (lines[0]?.trim() !== expectedHeader) {
    throw invalidReport("Only a complete all-rooms allocation report can be updated.");
  }

  const { rooms, allocatedRollNos, occupiedCount } = parseReport(lines);
  const allocatedSummaryIndexes = [];
  const unallocatedSummaryIndexes = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (/^Total Students Allocated:\s*\d+\s*$/.test(lines[index])) {
      allocatedSummaryIndexes.push(index);
    }
    if (/^Students Not Allocated:\s*\d+\s*$/.test(lines[index])) {
      unallocatedSummaryIndexes.push(index);
    }
  }

  if (allocatedSummaryIndexes.length !== 1 || unallocatedSummaryIndexes.length !== 1) {
    throw invalidReport("The allocation summary is missing or duplicated.");
  }
  const currentAllocatedSummary = Number(
    lines[allocatedSummaryIndexes[0]].match(/\d+/)[0]
  );
  if (currentAllocatedSummary !== occupiedCount) {
    throw invalidReport("The allocation summary does not match the seat assignments.");
  }

  const studentsByRollNo = new Map();
  for (const student of students) {
    if (!student.rollNo || studentsByRollNo.has(student.rollNo)) {
      throw invalidReport("The student roster contains duplicate or missing roll numbers.");
    }
    studentsByRollNo.set(student.rollNo, student);
  }

  for (const room of rooms) {
    for (const row of room.rows) {
      for (const seat of row.seats) {
        if (!seat.rollNo) continue;
        const student = studentsByRollNo.get(seat.rollNo);
        if (!student) {
          throw invalidReport("The report contains a student missing from the current roster.");
        }
        if (getGroupLabel(student, mode) !== seat.groupLabel) {
          throw invalidReport("The report does not match the current course or section roster.");
        }
      }
    }
  }

  if (allocatedRollNos.size > studentsByRollNo.size) {
    throw invalidReport("The report contains more students than the current roster.");
  }

  const availableByGroup = new Map();
  for (const student of students) {
    if (allocatedRollNos.has(student.rollNo)) continue;
    const groupLabel = getGroupLabel(student, mode);
    if (!groupLabel) continue;

    if (!availableByGroup.has(groupLabel)) {
      availableByGroup.set(groupLabel, {
        courseName: student.course.courseName,
        special: [],
        regular: [],
      });
    }
    const group = availableByGroup.get(groupLabel);
    const requiresSpecialSeat = student.specialSeatReq || student.specialReq;
    group[requiresSpecialSeat ? "special" : "regular"].push(student);
  }
  for (const group of availableByGroup.values()) {
    group.special.sort((left, right) => compareRollNumbers(left.rollNo, right.rollNo));
    group.regular.sort((left, right) => compareRollNumbers(left.rollNo, right.rollNo));
  }

  const roomsByKey = new Map(
    databaseRooms.map((room) => [roomKey(room.building.buildingName, room.roomNumber), room])
  );
  const updatesByLine = new Map();
  let filledCount = 0;
  let skippedRooms = 0;

  for (const room of rooms) {
    const databaseRoom = roomsByKey.get(roomKey(room.building, room.roomNumber));
    if (!databaseRoom) {
      throw invalidReport("An allocated room is missing from the current room roster.");
    }
    const { rows, columns, capacity } = roomCapacity(databaseRoom);
    const specialSeatCount = Math.min(
      Math.max(0, Number(databaseRoom.specialSeatCount) || 0),
      capacity
    );

    const seatGroupByPosition = new Map();
    const roomCourses = new Set();
    let hasValidEmptySeat = false;
    for (const row of room.rows) {
      for (const seat of row.seats) {
        if (
          seat.row > rows ||
          seat.column > columns ||
          !isValidPosition(seat.row, seat.column, columns, capacity)
        ) {
          if (seat.rollNo) {
            throw invalidReport("An occupied seat falls outside the current room capacity.");
          }
          continue;
        }
        const physicalIndex = (seat.row - 1) * columns + seat.column - 1;
        if (seat.rollNo && seat.isSpecial !== (physicalIndex < specialSeatCount)) {
          throw invalidReport("The current special-seat configuration does not match the report.");
        }

        if (seat.rollNo) {
          seatGroupByPosition.set(`${seat.row},${seat.column}`, seat.groupLabel);
          roomCourses.add(studentsByRollNo.get(seat.rollNo).course.courseName);
        } else {
          hasValidEmptySeat = true;
        }
      }
    }

    if (mode === "section" && roomCourses.size > 1) {
      throw invalidReport("A section-mode room contains more than one exact course.");
    }

    let allowedCourseName = roomCourses.size === 1
      ? [...roomCourses][0]
      : null;
    const roomUpdates = new Map();
    let roomFilledCount = 0;
    for (const row of room.rows) {
      for (const seat of row.seats) {
        if (
          seat.rollNo ||
          seat.row > rows ||
          seat.column > columns ||
          !isValidPosition(seat.row, seat.column, columns, capacity)
        ) {
          continue;
        }

        const physicalIndex = (seat.row - 1) * columns + seat.column - 1;
        const requiresSpecialSeat = physicalIndex < specialSeatCount;
        const adjacentGroups = new Set([
          seatGroupByPosition.get(`${seat.row - 1},${seat.column}`),
          seatGroupByPosition.get(`${seat.row + 1},${seat.column}`),
          seatGroupByPosition.get(`${seat.row},${seat.column - 1}`),
          seatGroupByPosition.get(`${seat.row},${seat.column + 1}`),
        ].filter(Boolean));
        const selected = chooseUnallocatedStudent(
          availableByGroup,
          mode,
          allowedCourseName,
          adjacentGroups,
          requiresSpecialSeat
        );
        if (!selected) continue;
        const { student, groupLabel } = selected;

        const specialLabel = requiresSpecialSeat ? " [SPECIAL]" : "";
        roomUpdates.set(
          `${seat.row},${seat.column}`,
          `${groupLabel} (${student.rollNo})${specialLabel}`
        );
        seatGroupByPosition.set(`${seat.row},${seat.column}`, groupLabel);
        if (mode === "section" && !allowedCourseName) {
          allowedCourseName = student.course.courseName;
        }
        allocatedRollNos.add(student.rollNo);
        roomFilledCount += 1;
      }
    }

    if (hasValidEmptySeat && roomFilledCount === 0) {
      skippedRooms += 1;
    }

    if (roomFilledCount > 0) {
      updatesByLine.set(room.allocatedLineIndex, room.allocatedStudents + roomFilledCount);
      for (const row of room.rows) {
        updatesByLine.set(row.lineIndex, { line: row.line, seats: roomUpdates });
      }
      filledCount += roomFilledCount;
    }
  }

  if (filledCount === 0) {
    return {
      report,
      filledCount,
      remainingUnallocated: studentsByRollNo.size - allocatedRollNos.size,
      skippedRooms,
    };
  }

  const updatedLines = [...lines];
  for (const [lineIndex, update] of updatesByLine) {
    if (typeof update === "number") {
      updatedLines[lineIndex] = `Allocated students: ${update}`;
      continue;
    }

    updatedLines[lineIndex] = update.line.replace(
      /R(\d+)C(\d+):\s*EMPTY\b/g,
      (cell, row, column) => {
        const studentLabel = update.seats.get(`${row},${column}`);
        return studentLabel
          ? `R${row}C${column}: ${studentLabel}`
          : cell;
      }
    );
  }

  const totalAllocated = allocatedRollNos.size;
  updatedLines[allocatedSummaryIndexes[0]] = `Total Students Allocated: ${totalAllocated}`;
  updatedLines[unallocatedSummaryIndexes[0]] =
    `Students Not Allocated: ${studentsByRollNo.size - totalAllocated}`;

  return {
    report: updatedLines.join("\n"),
    filledCount,
    remainingUnallocated: studentsByRollNo.size - totalAllocated,
    skippedRooms,
  };
}

module.exports = { fillUnallocatedSeats };
