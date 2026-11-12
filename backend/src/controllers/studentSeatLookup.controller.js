const fs = require("fs/promises");
const path = require("path");
const prisma = require("../config/prisma");
const { parseAllocationRooms } = require("../utils/seatAllocationReport");

function canSearchStudentSeats(user) {
  return user?.roleGroup === "ADMIN" ||
    (user?.roleGroup === "STAFF" && ["FACULTY", "EXAM_OFFICER"].includes(user.role));
}

exports.getStudentSeatDetails = async (req, res) => {
  try {
    if (!canSearchStudentSeats(req.user)) {
      return res.status(403).json({
        message: "Admin, faculty, or exam officer access required",
      });
    }

    const rollNo = typeof req.params.rollNo === "string"
      ? req.params.rollNo.trim()
      : "";
    if (!rollNo || rollNo.length > 64) {
      return res.status(400).json({ message: "Enter a valid student roll number" });
    }

    const student = await prisma.student.findUnique({
      where: { rollNo },
      select: {
        rollNo: true,
        fullName: true,
        section: true,
        semester: true,
        specialReq: true,
        specialSeatReq: true,
        course: {
          select: {
            courseName: true,
            courseCode: true,
            courseLevel: true,
          },
        },
        user: {
          select: { email: true },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ message: "No student found with that roll number" });
    }

    const reportPath = path.join(__dirname, "..", "scripts", "seat-allocation.txt");
    const report = await fs.readFile(reportPath, "utf8");
    const assignedRoom = parseAllocationRooms(report).find((room) =>
      room.rows.some((row) =>
        row.some((seat) => seat.rollNo === rollNo)
      )
    );

    if (!assignedRoom) {
      return res.status(200).json({
        student: {
          rollNo: student.rollNo,
          fullName: student.fullName,
          email: student.user?.email || null,
          courseName: student.course.courseName,
          courseCode: student.course.courseCode,
          courseLevel: student.course.courseLevel,
          section: student.section,
          semester: student.semester,
          specialReq: student.specialReq,
          specialSeatReq: student.specialSeatReq,
        },
        room: null,
        message: "Student found, but no seat allocation is present in the current report.",
      });
    }

    const studentSeat = assignedRoom.rows
      .flat()
      .find((seat) => seat.rollNo === rollNo);
    const seats = assignedRoom.rows.flat();

    return res.status(200).json({
      student: {
        rollNo: student.rollNo,
        fullName: student.fullName,
        email: student.user?.email || null,
        courseName: student.course.courseName,
        courseCode: student.course.courseCode,
        courseLevel: student.course.courseLevel,
        section: student.section,
        semester: student.semester,
        specialReq: student.specialReq,
        specialSeatReq: student.specialSeatReq,
      },
      room: {
        building: assignedRoom.building,
        roomNumber: assignedRoom.roomNumber,
        allocatedStudents: assignedRoom.allocatedStudents,
        totalRows: assignedRoom.rows.length,
        totalColumns: Math.max(...assignedRoom.rows.map((row) => row.length)),
        totalSeats: seats.length,
        specialSeatCount: seats.filter((seat) => seat.isSpecial).length,
        seatCode: `R${studentSeat.row}C${studentSeat.column}`,
        seat: {
          row: studentSeat.row,
          column: studentSeat.column,
          isSpecial: studentSeat.isSpecial,
        },
        invigilators: assignedRoom.invigilators,
        rows: assignedRoom.rows.map((row) =>
          row.map((seat) => ({
            row: seat.row,
            column: seat.column,
            isEmpty: seat.isEmpty,
            isSpecial: seat.isSpecial,
            isCurrentStudent: seat.rollNo === rollNo,
          }))
        ),
      },
    });
  } catch (error) {
    console.error("Student seat lookup error:", error);
    return res.status(500).json({
      message: "Unable to load student seating details",
    });
  }
};
