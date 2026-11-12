const fs = require("fs/promises");
const path = require("path");

const STUDENT_ALLOCATION_MODE_KEY = "student-allocation-mode";
const ALLOCATION_REPORTS = {
  course: "seat-allocation.txt",
  section: "seat-allocation-CT.txt",
};

function isValidAllocationMode(mode) {
  return Object.prototype.hasOwnProperty.call(ALLOCATION_REPORTS, mode);
}

async function getStudentAllocationMode(prisma) {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: STUDENT_ALLOCATION_MODE_KEY },
  });

  if (!setting || !isValidAllocationMode(setting.value)) {
    throw new Error(
      "Student allocation mode is not configured. Apply the database migration and verify the setting."
    );
  }

  return setting.value;
}

function getAllocationReportPath(mode) {
  if (!isValidAllocationMode(mode)) {
    throw new Error(`Unsupported student allocation mode: ${mode}`);
  }

  return path.join(
    __dirname,
    "..",
    "scripts",
    ALLOCATION_REPORTS[mode]
  );
}

async function readAllocationReport(mode) {
  const reportPath = getAllocationReportPath(mode);
  let report;

  try {
    report = await fs.readFile(reportPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      const unavailableError = new Error(
        `The ${mode}-based seat allocation report has not been generated yet.`
      );
      unavailableError.code = "ALLOCATION_REPORT_UNAVAILABLE";
      throw unavailableError;
    }

    throw error;
  }

  const hasAssignedSeats =
    /^Row\s+\d+:.*R\d+C\d+:[^|]*\(BWU\/[^)]+\)/m.test(report);

  if (!hasAssignedSeats) {
    const unavailableError = new Error(
      `The ${mode}-based seat allocation report has no assigned seats.`
    );
    unavailableError.code = "ALLOCATION_REPORT_UNAVAILABLE";
    throw unavailableError;
  }

  return { report, reportPath };
}

module.exports = {
  STUDENT_ALLOCATION_MODE_KEY,
  getStudentAllocationMode,
  isValidAllocationMode,
  readAllocationReport,
};
