
const prisma = require("../config/prisma");

const buildings = [
  {
    buildingCode: "UB1",
    buildingName: "University Building 1",
    totalRooms: 30,
  },
  {
    buildingCode: "UB2",
    buildingName: "University Building 2",
    totalRooms: 25,
  },
  {
    buildingCode: "UB3",
    buildingName: "University Building 3",
    totalRooms: 20,
  },
];

// Different physical room configurations
const layouts = [
  { rows: 6, columns: 5 },  // 30 seats
  { rows: 5, columns: 10 }, // 50 seats
  { rows: 10, columns: 6 }, // 60 seats
];

async function seedBuildingsRooms() {
  try {
    // Prevent accidental duplicate seeding
    const buildingCount = await prisma.building.count();
    const roomCount = await prisma.room.count();
    const seatCount = await prisma.roomSeat.count();

    if (buildingCount > 0 || roomCount > 0 || seatCount > 0) {
      throw new Error(
        "Building, Room or RoomSeat data already exists. Seeding cancelled."
      );
    }

    let globalRoomIndex = 0;
    let totalSeats = 0;

    await prisma.$transaction(async (tx) => {
      for (const buildingData of buildings) {
        const building = await tx.building.create({
          data: {
            buildingCode: buildingData.buildingCode,
            buildingName: buildingData.buildingName,
          },
        });

        let buildingSeats = 0;

        for (let i = 1; i <= buildingData.totalRooms; i++) {
          // Cycle through all three layouts
          const layout = layouts[globalRoomIndex % layouts.length];

          const room = await tx.room.create({
            data: {
              roomNumber: `ROOM-${String(i).padStart(3, "0")}`,
              totalRows: layout.rows,
              totalColumns: layout.columns,
              buildingId: building.id,
            },
          });

          const seats = [];

          // Generate seats row by row
          for (let row = 1; row <= layout.rows; row++) {
            for (
              let column = 1;
              column <= layout.columns;
              column++
            ) {
              const seatNumber =
                (row - 1) * layout.columns + column;

              seats.push({
                seatNumber,
                rowNumber: row,
                columnNumber: column,
                roomId: room.id,
              });
            }
          }

          await tx.roomSeat.createMany({
            data: seats,
          });

          const roomCapacity = layout.rows * layout.columns;

          buildingSeats += roomCapacity;
          totalSeats += roomCapacity;
          globalRoomIndex++;
        }

        console.log(
          `${buildingData.buildingCode}: ${buildingData.totalRooms} rooms, ${buildingSeats} seats`
        );
      }
    }, {
      maxWait: 10000,
      timeout: 60000,
    });

    console.log("\nBuilding and room seeding completed!");
    console.log(`Total buildings: ${buildings.length}`);
    console.log(
      `Total rooms: ${buildings.reduce((sum, b) => sum + b.totalRooms, 0)}`
    );
    console.log(`Total physical seats: ${totalSeats}`);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seedBuildingsRooms();
