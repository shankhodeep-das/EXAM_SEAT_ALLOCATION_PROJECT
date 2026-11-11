const fs = require("fs/promises");
const path = require("path");
const prisma = require("../config/prisma");

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

async function getAssignedRooms(employeeId) {
  if (!employeeId) return [];

  const reportPath = path.join(__dirname, "..", "scripts", "seat-allocation.txt");
  const report = await fs.readFile(reportPath, "utf8");
  return parseAssignedRooms(report, employeeId);
}

async function getAdminRooms() {
  const scriptsPath = path.join(__dirname, "..", "scripts");
  const [allocationReport, emptySeatReport] = await Promise.all([
    fs.readFile(path.join(scriptsPath, "seat-allocation.txt"), "utf8"),
    fs.readFile(path.join(scriptsPath, "empty-seat-report.txt"), "utf8"),
  ]);
  const emptySeatsByRoom = parseEmptySeatReport(emptySeatReport);

  return parseAllocationRooms(allocationReport).map((room) => {
    const reportRoom = emptySeatsByRoom.get(`${room.building}\u0000${room.roomNumber}`);
    const emptyPositions = new Set(
      (reportRoom?.emptySeatPositions || []).map(({ row, column }) => `${row},${column}`)
    );

    return {
      ...room,
      emptySeatPositions: reportRoom?.emptySeatPositions || [],
      rows: room.rows.map((row) =>
        row.map((seat) => ({
          ...seat,
          isEmpty: emptyPositions.has(`${seat.row},${seat.column}`),
        }))
      ),
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
      ? await getAssignedRooms(user.faculty?.employeeId)
      : [];
    const adminRooms = user.role.roleGroup === "ADMIN"
      ? await getAdminRooms()
      : [];

    return res.status(200).json({
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
    console.error("Staff dashboard data error:", error);
    return res.status(500).json({
      message: "Unable to load staff dashboard data",
    });
  }
};

exports.parseAssignedRooms = parseAssignedRooms;
exports.parseAllocationRooms = parseAllocationRooms;
exports.parseEmptySeatReport = parseEmptySeatReport;
