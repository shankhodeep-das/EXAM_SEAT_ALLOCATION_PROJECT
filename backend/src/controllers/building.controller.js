const prisma = require("../config/prisma");

const MAX_ROOMS_PER_REQUEST = 100;
const MAX_ROOM_CAPACITY = 1000;

function canManageBuildings(user) {
  return user?.roleGroup === "ADMIN" || user?.role === "EXAM_OFFICER";
}

function validateRooms(rooms) {
  if (!Array.isArray(rooms) || rooms.length < 1 || rooms.length > MAX_ROOMS_PER_REQUEST) {
    return { error: `Enter between 1 and ${MAX_ROOMS_PER_REQUEST} rooms` };
  }

  const seenRoomNumbers = new Set();
  const normalizedRooms = [];

  for (const room of rooms) {
    if (!room || typeof room !== "object" || Array.isArray(room)) {
      return { error: "Each room must include a room number and seat layout" };
    }

    const roomNumber = typeof room.roomNumber === "string" ? room.roomNumber.trim() : "";
    const totalRows = Number(room.totalRows);
    const totalColumns = Number(room.totalColumns);
    const specialSeatCount = Number(room.specialSeatCount);
    const capacity = totalRows * totalColumns;

    if (
      !roomNumber ||
      roomNumber.length > 40 ||
      !Number.isInteger(totalRows) ||
      totalRows < 1 ||
      !Number.isInteger(totalColumns) ||
      totalColumns < 1
    ) {
      return {
        error: `Room ${roomNumber || "(unnamed)"} needs a room number and positive whole-number dimensions`,
      };
    }

    if (capacity > MAX_ROOM_CAPACITY) {
      return { error: `Room ${roomNumber} cannot exceed ${MAX_ROOM_CAPACITY} seats` };
    }

    if (
      room.specialSeatCount === "" ||
      !Number.isInteger(specialSeatCount) ||
      specialSeatCount < 0 ||
      specialSeatCount > capacity
    ) {
      return {
        error: `Room ${roomNumber} needs a special-seat count between 0 and its capacity (${capacity})`,
      };
    }

    const normalizedRoomNumber = roomNumber.toLowerCase();
    if (seenRoomNumbers.has(normalizedRoomNumber)) {
      return { error: `Room number ${roomNumber} appears more than once` };
    }
    seenRoomNumbers.add(normalizedRoomNumber);

    normalizedRooms.push({
      roomNumber,
      totalRows,
      totalColumns,
      specialSeatCount,
    });
  }

  return { rooms: normalizedRooms };
}

exports.getBuildings = async (req, res) => {
  try {
    if (!canManageBuildings(req.user)) {
      return res.status(403).json({ message: "Admin or exam officer access required" });
    }

    const buildings = await prisma.building.findMany({
      orderBy: { buildingCode: "asc" },
      include: {
        rooms: {
          orderBy: { roomNumber: "asc" },
          select: {
            id: true,
            roomNumber: true,
            totalRows: true,
            totalColumns: true,
            specialSeatCount: true,
          },
        },
      },
    });

    return res.status(200).json({ buildings });
  } catch (error) {
    console.error("Building list error:", error);
    return res.status(500).json({ message: "Unable to load buildings" });
  }
};

exports.addBuildingRooms = async (req, res) => {
  try {
    if (!canManageBuildings(req.user)) {
      return res.status(403).json({ message: "Admin or exam officer access required" });
    }

    const { buildingId, buildingCode, buildingName } = req.body || {};
    const validation = validateRooms(req.body?.rooms);
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const isExistingBuilding = buildingId !== undefined && buildingId !== null;
    let existingBuilding = null;
    let normalizedBuildingCode = null;
    let normalizedBuildingName = null;

    if (isExistingBuilding) {
      const parsedBuildingId = Number(buildingId);
      if (!Number.isInteger(parsedBuildingId) || parsedBuildingId < 1) {
        return res.status(400).json({ message: "Select a valid building" });
      }

      existingBuilding = await prisma.building.findUnique({
        where: { id: parsedBuildingId },
        select: { id: true, buildingCode: true, buildingName: true },
      });
      if (!existingBuilding) {
        return res.status(404).json({ message: "Selected building was not found" });
      }
    } else {
      normalizedBuildingCode =
        typeof buildingCode === "string" ? buildingCode.trim().toUpperCase() : "";
      normalizedBuildingName =
        typeof buildingName === "string" ? buildingName.trim() : "";

      if (
        !/^[A-Z0-9][A-Z0-9_-]{1,23}$/.test(normalizedBuildingCode) ||
        normalizedBuildingName.length < 2 ||
        normalizedBuildingName.length > 80
      ) {
        return res.status(400).json({
          message: "Enter a valid building code and a building name of 2 to 80 characters",
        });
      }
    }

    const result = await prisma.$transaction(async (transaction) => {
      const building = existingBuilding
        ? existingBuilding
        : await transaction.building.create({
            data: {
              buildingCode: normalizedBuildingCode,
              buildingName: normalizedBuildingName,
            },
            select: { id: true, buildingCode: true, buildingName: true },
          });

      const createdRooms = [];
      for (const room of validation.rooms) {
        const createdRoom = await transaction.room.create({
          data: {
            ...room,
            buildingId: building.id,
          },
          select: {
            id: true,
            roomNumber: true,
            totalRows: true,
            totalColumns: true,
            specialSeatCount: true,
          },
        });

        const seats = [];
        for (let rowNumber = 1; rowNumber <= room.totalRows; rowNumber++) {
          for (let columnNumber = 1; columnNumber <= room.totalColumns; columnNumber++) {
            seats.push({
              seatNumber: (rowNumber - 1) * room.totalColumns + columnNumber,
              rowNumber,
              columnNumber,
              roomId: createdRoom.id,
            });
          }
        }

        await transaction.roomSeat.createMany({ data: seats });
        createdRooms.push(createdRoom);
      }

      return { building, rooms: createdRooms };
    }, {
      maxWait: 10000,
      timeout: 60000,
    });

    return res.status(201).json({
      message: `Added ${result.rooms.length} room${result.rooms.length === 1 ? "" : "s"} to ${result.building.buildingName}`,
      ...result,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "That building code or room number already exists",
      });
    }

    console.error("Building and room creation error:", error);
    return res.status(500).json({ message: "Unable to add building rooms" });
  }
};
