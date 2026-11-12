const prisma = require("../config/prisma");
const { parseAllocationRooms } = require("../utils/seatAllocationReport");
const { createInvigilationPdf } = require("../utils/invigilationPdf");
const {
  getStudentAllocationMode,
  readAllocationReport,
} = require("../utils/studentAllocationMode");

exports.getStaffInvigilationReport = async (req, res) => {
  if (req.user?.roleGroup !== "STAFF") {
    return res.status(403).json({ message: "Faculty access required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true, faculty: true },
    });

    if (
      !user ||
      !user.isActive ||
      user.role.roleGroup !== "STAFF" ||
      user.faculty?.staffType !== "FACULTY" ||
      !user.faculty.isActive
    ) {
      return res.status(403).json({ message: "Faculty access required" });
    }

    const mode = await getStudentAllocationMode(prisma);
    const { report } = await readAllocationReport(mode);
    const assignedRooms = parseAllocationRooms(report)
      .filter((room) =>
        room.invigilators.some(
          (invigilator) => invigilator.employeeId === user.faculty.employeeId
        )
      );

    if (assignedRooms.length === 0) {
      return res.status(404).json({
        message: "No invigilation assignments were found for your account.",
      });
    }

    const pdf = await createInvigilationPdf(user.faculty, mode, assignedRooms);
    return res
      .status(200)
      .set({
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="invigilation-assignments.pdf"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      })
      .send(pdf);
  } catch (error) {
    if (error.code === "ALLOCATION_REPORT_UNAVAILABLE") {
      return res.status(503).json({ message: error.message });
    }

    console.error("Unable to create faculty invigilation PDF:", error);
    return res.status(500).json({
      message: "Unable to create the invigilation assignment PDF.",
    });
  }
};
