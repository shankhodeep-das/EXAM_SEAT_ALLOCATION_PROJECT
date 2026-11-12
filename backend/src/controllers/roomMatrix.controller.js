const { spawn } = require("child_process");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const prisma = require("../config/prisma");
const { fillUnallocatedSeats } = require("../utils/fillUnallocatedSeats");
const {
  getStudentAllocationMode,
  readAllocationReport,
} = require("../utils/studentAllocationMode");

const MAX_COURSES_PER_ROOM = 5;
const ALLOCATION_TIMEOUT_MS = 15 * 60 * 1000;
const MAX_CAPTURED_OUTPUT = 200000;

let roomMatrixOperationRunning = false;

function appendOutput(current, chunk) {
  return `${current}${chunk.toString("utf8")}`.slice(-MAX_CAPTURED_OUTPUT);
}

async function runAllocation(req, res, config) {
  if (req.user?.roleGroup !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }

  const allocationLimit = req.body?.[config.inputField];
  if (
    !Number.isInteger(allocationLimit) ||
    allocationLimit < 1 ||
    allocationLimit > MAX_COURSES_PER_ROOM
  ) {
    return res.status(400).json({
      message: `${config.limitLabel} per room must be a whole number from 1 to ${MAX_COURSES_PER_ROOM}`,
    });
  }

  if (roomMatrixOperationRunning) {
    return res.status(409).json({
      message: "Another room-matrix operation is running. Please wait for it to finish.",
    });
  }

  roomMatrixOperationRunning = true;
  let timedOut = false;
  let stdout = "";
  let stderr = "";
  let child;
  let timeout;

  try {
    const scriptPath = path.join(__dirname, "..", "scripts", config.scriptName);
    child = spawn(
      process.execPath,
      [scriptPath, `${config.argumentName}=${allocationLimit}`],
      {
        cwd: path.dirname(scriptPath),
        env: process.env,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    child.stdout.on("data", (chunk) => {
      stdout = appendOutput(stdout, chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr = appendOutput(stderr, chunk);
    });

    const completion = new Promise((resolve) => {
      child.once("error", (error) => resolve({ error }));
      child.once("close", (code, signal) => resolve({ code, signal }));
    });

    timeout = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, ALLOCATION_TIMEOUT_MS);

    const result = await completion;
    clearTimeout(timeout);

    if (result.error) {
      console.error(`Unable to start ${config.label} allocation:`, result.error);
      return res.status(500).json({
        message: `Unable to start the ${config.label} allocation process`,
      });
    }

    if (timedOut) {
      console.error(`${config.label} allocation process timed out:`, stderr.slice(-2000));
      return res.status(504).json({
        message: `${config.label} allocation timed out. Check the current report before trying again.`,
      });
    }

    if (result.code !== 0) {
      console.error(
        `${config.label} allocation exited with code ${result.code} (${result.signal || "no signal"}):`,
        stderr.slice(-2000),
        stdout.slice(-2000)
      );

      const output = `${stderr}\n${stdout}`;
      const knownFailure = output.match(
        /Not enough active faculty[^\r\n]*|No students were found[^\r\n]*|No rooms were assigned[^\r\n]*|has no section[^\r\n]*/
      );
      return res.status(500).json({
        message: knownFailure?.[0] ||
          `${config.label} allocation failed. Check the server logs for details.`,
      });
    }

    const summary = stdout
      .split(/\r?\n/)
      .filter((line) => /^(Total Rooms Used|Total Students Allocated|Students Not Allocated):/.test(line));

    return res.status(200).json({
      message: `${config.label} allocation completed successfully. ${config.reportFile} has been updated.`,
      [config.responseField]: allocationLimit,
      summary,
    });
  } catch (error) {
    console.error(`${config.label} allocation error:`, error);
    return res.status(500).json({
      message: `Unable to complete ${config.label.toLowerCase()} allocation`,
    });
  } finally {
    if (timeout) clearTimeout(timeout);
    roomMatrixOperationRunning = false;
  }
}

async function replaceReportAtomically(reportPath, report) {
  const temporaryPath = `${reportPath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryPath, report, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    await fs.rename(temporaryPath, reportPath);
  } catch (error) {
    try {
      await fs.unlink(temporaryPath);
    } catch (cleanupError) {
      if (cleanupError.code !== "ENOENT") {
        console.error("Unable to remove temporary allocation report:", cleanupError);
      }
    }
    throw error;
  }
}

exports.fillEmptySeats = async (req, res) => {
  if (req.user?.roleGroup !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }

  if (roomMatrixOperationRunning) {
    return res.status(409).json({
      message: "Another room-matrix operation is running. Please wait for it to finish.",
    });
  }

  roomMatrixOperationRunning = true;
  try {
    const mode = await getStudentAllocationMode(prisma);
    const { report, reportPath } = await readAllocationReport(mode);
    const [students, databaseRooms] = await Promise.all([
      prisma.student.findMany({
        include: { course: true },
        orderBy: { rollNo: "asc" },
      }),
      prisma.room.findMany({
        include: {
          building: { select: { buildingName: true } },
          seats: true,
        },
      }),
    ]);

    const result = fillUnallocatedSeats({
      report,
      mode,
      students,
      rooms: databaseRooms,
    });

    if (result.filledCount > 0) {
      await replaceReportAtomically(reportPath, result.report);
    }

    return res.status(200).json({
      mode,
      filledCount: result.filledCount,
      remainingUnallocated: result.remainingUnallocated,
      skippedRooms: result.skippedRooms,
      message: result.filledCount > 0
        ? `Filled ${result.filledCount} empty seats in the current ${mode} report. The other allocation report was not changed.`
        : "No compatible unallocated students could be placed in the current report. No files were changed.",
    });
  } catch (error) {
    if (error.code === "ALLOCATION_REPORT_UNAVAILABLE") {
      return res.status(503).json({ message: error.message });
    }

    if (error.code === "INVALID_ALLOCATION_REPORT") {
      console.error("Empty-seat fill rejected inconsistent allocation data:", error.message);
      return res.status(409).json({
        message: "The current allocation or room roster is inconsistent. No report was changed.",
      });
    }

    console.error("Unable to fill empty seats:", error);
    return res.status(500).json({
      message: "Unable to fill empty seats. No report was changed.",
    });
  } finally {
    roomMatrixOperationRunning = false;
  }
};

exports.runRoomAllocation = (req, res) => runAllocation(req, res, {
  inputField: "maxCoursesPerRoom",
  argumentName: "--max-courses",
  scriptName: "allocateSeats.js",
  limitLabel: "Courses",
  label: "Seat",
  reportFile: "seat-allocation.txt",
  responseField: "maxCoursesPerRoom",
});

exports.runSectionAllocation = (req, res) => runAllocation(req, res, {
  inputField: "maxSectionsPerRoom",
  argumentName: "--max-sections",
  scriptName: "allocatedSeatsCT.js",
  limitLabel: "Sections",
  label: "Section",
  reportFile: "seat-allocation-CT.txt",
  responseField: "maxSectionsPerRoom",
});
