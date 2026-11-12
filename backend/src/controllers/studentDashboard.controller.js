const prisma = require("../config/prisma");
const {
  getStudentAllocationMode,
  readAllocationReport,
} = require("../utils/studentAllocationMode");

exports.getStudentDashboard = async (req, res) => {
  try {
    if (req.user.roleGroup !== "STUDENT") {
      return res.status(403).json({ message: "Student access required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        student: {
          include: { course: true },
        },
      },
    });

    if (!user || !user.student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const allocationMode = await getStudentAllocationMode(prisma);
    const { report } = await readAllocationReport(allocationMode);
    const rooms = [];
    let currentRoom = null;

    for (const line of report.split(/\r?\n/)) {
      const roomMatch = line.match(/^Room:\s*(.*?)\s+-\s+(.+?)\s*$/);
      if (roomMatch) {
        currentRoom = {
          building: roomMatch[1],
          roomNumber: roomMatch[2],
          allocatedStudents: 0,
          invigilators: [],
          rows: [],
        };
        rooms.push(currentRoom);
        continue;
      }

      if (!currentRoom) continue;

      const allocatedMatch = line.match(/^Allocated students:\s*(\d+)\s*$/);
      if (allocatedMatch) {
        currentRoom.allocatedStudents = Number(allocatedMatch[1]);
        continue;
      }

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
        const isEmpty = seatText === "EMPTY";
        const groupName = rollNoMatch
          ? seatText.slice(0, rollNoMatch.index).trim()
          : null;
        const allocationGroup = groupName;

        rowSeats.push({
          row,
          column,
          isEmpty,
          courseName: allocationMode === "course" ? groupName : null,
          allocationGroup,
          rollNo,
          isSpecial: /\[SPECIAL\]/.test(seatText),
          isCurrentStudent: rollNo === user.student.rollNo,
        });
      }

      if (rowSeats.length > 0) currentRoom.rows.push(rowSeats);
    }

    const room = rooms.find(candidate =>
      candidate.rows.some(row =>
        row.some(seat => seat.isCurrentStudent)
      )
    );

    if (!room) {
      return res.status(404).json({
        message: "No seat allocation was found for your roll number",
      });
    }

    return res.status(200).json({
      allocationMode,
      student: {
        fullName: user.student.fullName,
        rollNo: user.student.rollNo,
        email: user.email,
        courseName: user.student.course.courseName,
        section: user.student.section,
        semester: user.student.semester,
      },
      room,
    });
  } catch (error) {
    if (error.code === "ALLOCATION_REPORT_UNAVAILABLE") {
      return res.status(503).json({ message: error.message });
    }

    console.error("Student dashboard data error:", error);
    return res.status(500).json({
      message: "Unable to load student dashboard data",
    });
  }
};
