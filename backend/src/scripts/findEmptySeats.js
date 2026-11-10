const fs = require("fs/promises");
const path = require("path");

async function main() {
  const defaultInput = path.join(__dirname, "seat-allocation.txt");
  const defaultOutput = path.join(__dirname, "empty-seat-report.txt");
  const inputPath = path.resolve(process.argv[2] || defaultInput);
  const outputPath = path.resolve(process.argv[3] || defaultOutput);

  if (inputPath === outputPath) {
    throw new Error("Input and output paths must be different.");
  }

  const report = await fs.readFile(inputPath, "utf8");
  const rooms = [];
  let currentRoom = null;

  for (const line of report.split(/\r?\n/)) {
    const roomMatch = line.match(/^Room:\s*(.*?)\s+-\s+(.+?)\s*$/);
    if (roomMatch) {
      currentRoom = {
        building: roomMatch[1],
        roomNumber: roomMatch[2],
        emptySeats: [],
      };
      rooms.push(currentRoom);
      continue;
    }

    if (!currentRoom || !/^Row\s+\d+:/i.test(line)) continue;

    for (const seatMatch of line.matchAll(/R(\d+)C(\d+):\s*EMPTY\b/g)) {
      currentRoom.emptySeats.push({
        row: Number(seatMatch[1]),
        column: Number(seatMatch[2]),
      });
    }
  }

  if (rooms.length === 0) {
    throw new Error(`No room sections found in allocation report: ${inputPath}`);
  }

  const roomsWithEmptySeats = rooms.filter(room => room.emptySeats.length > 0);
  const outputLines = ["EMPTY SEAT REPORT", ""];

  if (roomsWithEmptySeats.length === 0) {
    outputLines.push("No empty seats found.");
  } else {
    for (const room of roomsWithEmptySeats) {
      outputLines.push(
        `Building: ${room.building}`,
        `Room Number: ${room.roomNumber}`,
        `Empty Seats: ${room.emptySeats.length}`,
        "Empty Seat Positions:",
        ...room.emptySeats.map(
          seat => `  Row ${seat.row}, Column ${seat.column}`
        ),
        ""
      );
    }
  }

  await fs.writeFile(outputPath, outputLines.join("\n"), "utf8");
  console.log(`Empty-seat report saved to: ${outputPath}`);
  console.log(`Rooms with empty seats: ${roomsWithEmptySeats.length}`);
  console.log(
    `Total empty seats: ${roomsWithEmptySeats.reduce(
      (total, room) => total + room.emptySeats.length,
      0
    )}`
  );
}

main().catch(error => {
  console.error("Failed to generate empty-seat report:", error.message);
  process.exitCode = 1;
});
