function parseAllocationRooms(report) {
  const rooms = [];
  let currentRoom = null;

  for (const line of report.split(/\r?\n/)) {
    const roomMatch = line.match(/^Room:\s*(.*?)\s+-\s+(.+?)\s*$/);
    if (roomMatch) {
      if (currentRoom) rooms.push(currentRoom);

      currentRoom = {
        building: roomMatch[1],
        roomNumber: roomMatch[2],
        invigilators: [],
        allocatedStudents: 0,
        rows: [],
      };
      continue;
    }

    if (!currentRoom) continue;

    const invigilatorsMatch = line.match(/^Invigilators:\s*(.*?)\s*$/);
    if (invigilatorsMatch) {
      currentRoom.invigilators = invigilatorsMatch[1]
        .split(/\s+\|\s+/)
        .filter(Boolean)
        .map((entry) => {
          const facultyMatch = entry.match(/^(.*?)\s+\(([^()]*)\)$/);
          return facultyMatch
            ? { fullName: facultyMatch[1], employeeId: facultyMatch[2] }
            : { fullName: entry, employeeId: null };
        });
      continue;
    }

    const allocatedMatch = line.match(/^Allocated students:\s*(\d+)\s*$/);
    if (allocatedMatch) {
      currentRoom.allocatedStudents = Number(allocatedMatch[1]);
      continue;
    }

    if (!/^Row\s+\d+:/i.test(line)) continue;

    const rowSeats = [];
    for (const match of line.matchAll(
      /R(\d+)C(\d+):\s*(.*?)(?=\s+\|\s+R\d+C\d+:|$)/g
    )) {
      const row = Number(match[1]);
      const column = Number(match[2]);
      const seatText = match[3].trim();
      const rollNoMatch = seatText.match(/\((BWU\/[^)]+)\)/);
      const rollNo = rollNoMatch ? rollNoMatch[1] : null;

      rowSeats.push({
        row,
        column,
        isEmpty: seatText === "EMPTY",
        courseName: rollNoMatch
          ? seatText.slice(0, rollNoMatch.index).trim()
          : null,
        rollNo,
        isSpecial: /\[SPECIAL\]/.test(seatText),
      });
    }

    if (rowSeats.length > 0) currentRoom.rows.push(rowSeats);
  }

  if (currentRoom) rooms.push(currentRoom);

  return rooms;
}

module.exports = { parseAllocationRooms };
