const prisma = require("../config/prisma");
const { parseAllocationRooms } = require("../utils/seatAllocationReport");
const {
  getStudentAllocationMode,
  readAllocationReport,
} = require("../utils/studentAllocationMode");

function parseEmptySeatReport(report) {
  const rooms = new Map();
  let currentRoom = null;

  for (const line of report.split(/\r?\n/)) {
    const buildingMatch = line.match(/^Building:\s*(.*?)\s*$/);
    if (buildingMatch) {
      if (currentRoom?.roomNumber) {
        rooms.set(`${currentRoom.building}\u0000${currentRoom.roomNumber}`, currentRoom);
      }
      currentRoom = { building: buildingMatch[1], roomNumber: null, emptySeatPositions: [] };
      continue;
    }

    if (!currentRoom) continue;

    const roomMatch = line.match(/^Room Number:\s*(.*?)\s*$/);
    if (roomMatch) {
      currentRoom.roomNumber = roomMatch[1];
      continue;
    }

    const positionMatch = line.match(/^\s*Row\s+(\d+),\s*Column\s+(\d+)\s*$/);
    if (positionMatch) {
      currentRoom.emptySeatPositions.push({
        row: Number(positionMatch[1]),
        column: Number(positionMatch[2]),
      });
    }
  }

  if (currentRoom?.roomNumber) {
    rooms.set(`${currentRoom.building}\u0000${currentRoom.roomNumber}`, currentRoom);
  }

  return rooms;
}

function parseAssignedRooms(report, employeeId) {
  if (!employeeId) return [];
  return parseAllocationRooms(report).filter((room) =>
    room.invigilators.some((faculty) => faculty.employeeId === employeeId)
  );
}

function getAssignedRooms(employeeId, report) {
  return parseAssignedRooms(report, employeeId);
}

function getAdminRooms(report) {
  return parseAllocationRooms(report).map((room) => {
    const emptySeatPositions = room.rows
      .flat()
      .filter((seat) => seat.isEmpty)
      .map(({ row, column }) => ({ row, column }));
    return {
      ...room,
      emptySeatPositions,
    };
  });
}

exports.getStaffDashboard = async (req, res) => {
  try {
    if (!["STAFF", "ADMIN"].includes(req.user.roleGroup)) {
      return res.status(403).json({ message: "Official access required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: true,
        faculty: {
          select: {
            employeeId: true,
            fullName: true,
            department: true,
            designation: true,
            staffType: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return res.status(404).json({ message: "Official account not found" });
    }

    const allocationMode = await getStudentAllocationMode(prisma);
    const { report } = await readAllocationReport(allocationMode);

    let staffMembers = [];
    if (user.role.roleGroup === "ADMIN") {
      const staffUsers = await prisma.user.findMany({
        where: {
          isActive: true,
          facultyId: { not: null },
        },
        include: {
          role: true,
          faculty: {
            select: {
              employeeId: true,
              fullName: true,
              designation: true,
              department: true,
              staffType: true,
            },
          },
        },
      });

      staffMembers = staffUsers
        .filter((staffUser) => staffUser.role.roleGroup === "STAFF")
        .map((staffUser) => ({
          fullName: staffUser.faculty.fullName,
          employeeId: staffUser.faculty.employeeId,
          role: staffUser.role.roleName,
          designation: staffUser.faculty.designation,
          department: staffUser.faculty.department,
          staffType: staffUser.faculty.staffType,
        }))
        .sort((a, b) => a.fullName.localeCompare(b.fullName));
    }

    const assignedRooms = user.role.roleGroup === "STAFF"
      ? getAssignedRooms(user.faculty?.employeeId, report)
      : [];
    const adminRooms = user.role.roleGroup === "ADMIN"
      ? getAdminRooms(report)
      : [];

    return res.status(200).json({
      allocationMode,
      user: {
        fullName: user.faculty?.fullName || null,
        employeeId: user.faculty?.employeeId || null,
        department: user.faculty?.department || null,
        designation: user.faculty?.designation || null,
        staffType: user.faculty?.staffType || null,
        email: user.email,
        role: user.role.roleName,
        roleGroup: user.role.roleGroup,
      },
      staffMembers,
      assignedRooms,
      adminRooms,
    });
  } catch (error) {
    if (error.code === "ALLOCATION_REPORT_UNAVAILABLE") {
      return res.status(503).json({ message: error.message });
    }

    console.error("Staff dashboard data error:", error);
    return res.status(500).json({
      message: "Unable to load staff dashboard data",
    });
  }
};

exports.parseAssignedRooms = parseAssignedRooms;
exports.parseAllocationRooms = parseAllocationRooms;
exports.parseEmptySeatReport = parseEmptySeatReport;
