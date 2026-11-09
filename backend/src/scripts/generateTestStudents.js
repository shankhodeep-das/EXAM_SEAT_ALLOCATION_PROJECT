
const prisma = require("../config/prisma");

const BUILDINGS = ["UB1", "UB2", "UB3"];

const ROOM_LAYOUTS = [
  { rows: 6, columns: 5 },
  { rows: 5, columns: 10 },
  { rows: 10, columns: 6 },
];

async function main() {
  await prisma.$transaction(
    async (tx) => {
      for (const buildingCode of BUILDINGS) {
        const building = await tx.building.findUnique({
          where: { buildingCode },
          include: {
            rooms: {
              orderBy: { roomNumber: "desc" },
              take: 1,
            },
          },
        });

        if (!building) {
          throw new Error(`Building ${buildingCode} not found`);
        }

        const lastRoom = building.rooms[0];

        const lastNumber = lastRoom
          ? Number(lastRoom.roomNumber.replace("ROOM-", ""))
          : 0;

        for (let i = 1; i <= 50; i++) {
          const roomNumber = lastNumber + i;

          const layout =
            ROOM_LAYOUTS[(roomNumber - 1) % ROOM_LAYOUTS.length];

          const room = await tx.room.create({
            data: {
              roomNumber: `ROOM-${String(roomNumber).padStart(3, "0")}`,
              totalRows: layout.rows,
              totalColumns: layout.columns,
              buildingId: building.id,
            },
          });

          const seats = [];

          for (let row = 1; row <= layout.rows; row++) {
            for (
              let column = 1;
              column <= layout.columns;
              column++
            ) {
              seats.push({
                seatNumber:
                  (row - 1) * layout.columns + column,
                rowNumber: row,
                columnNumber: column,
                roomId: room.id,
              });
            }
          }

          await tx.roomSeat.createMany({
            data: seats,
          });
        }

        console.log(`${buildingCode}: Added 50 rooms`);
      }
    },
    {
      maxWait: 10000,
      timeout: 90000,
    }
  );

  console.log("Successfully added 150 rooms!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
