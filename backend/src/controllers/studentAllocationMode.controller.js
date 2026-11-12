const prisma = require("../config/prisma");
const {
  STUDENT_ALLOCATION_MODE_KEY,
  getStudentAllocationMode,
  isValidAllocationMode,
  readAllocationReport,
} = require("../utils/studentAllocationMode");

function canChangeStudentAllocationMode(user) {
  return user?.roleGroup === "ADMIN" ||
    (user?.roleGroup === "STAFF" && user?.role === "EXAM_OFFICER");
}

exports.getStudentAllocationMode = async (req, res) => {
  if (!canChangeStudentAllocationMode(req.user)) {
    return res.status(403).json({
      message: "Admin or exam officer access required",
    });
  }

  try {
    const mode = await getStudentAllocationMode(prisma);
    return res.status(200).json({ mode });
  } catch (error) {
    console.error("Unable to load student allocation mode:", error);
    return res.status(500).json({
      message: "Unable to load the student allocation display setting",
    });
  }
};

exports.setStudentAllocationMode = async (req, res) => {
  if (!canChangeStudentAllocationMode(req.user)) {
    return res.status(403).json({
      message: "Admin or exam officer access required",
    });
  }

  const { mode } = req.body || {};
  if (!isValidAllocationMode(mode)) {
    return res.status(400).json({
      message: "Choose either the course or section arrangement",
    });
  }

  try {
    await readAllocationReport(mode);
  } catch (error) {
    if (error.code === "ALLOCATION_REPORT_UNAVAILABLE") {
      return res.status(409).json({ message: error.message });
    }

    console.error("Unable to verify student allocation report:", error);
    return res.status(500).json({
      message: "Unable to verify the selected seat allocation report",
    });
  }

  try {
    await prisma.systemSetting.upsert({
      where: { key: STUDENT_ALLOCATION_MODE_KEY },
      update: { value: mode },
      create: {
        key: STUDENT_ALLOCATION_MODE_KEY,
        value: mode,
      },
    });

    return res.status(200).json({
      mode,
      message: `Students will now see the ${mode}-based seat arrangement.`,
    });
  } catch (error) {
    console.error("Unable to save student allocation mode:", error);
    return res.status(500).json({
      message: "Unable to save the student allocation display setting",
    });
  }
};
