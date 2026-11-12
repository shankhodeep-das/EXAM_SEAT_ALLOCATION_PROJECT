const express = require("express");

const { authenticates } = require("../middleware/auth.middleware");
const {
  runRoomAllocation,
  runSectionAllocation,
  fillEmptySeats,
} = require("../controllers/roomMatrix.controller");
const {
  getStudentAllocationMode,
  setStudentAllocationMode,
} = require("../controllers/studentAllocationMode.controller");

const router = express.Router();

router.post("/run", authenticates, runRoomAllocation);
router.post("/run-sections", authenticates, runSectionAllocation);
router.post("/fill-empty-seats", authenticates, fillEmptySeats);
router.get("/display-mode", authenticates, getStudentAllocationMode);
router.put("/display-mode", authenticates, setStudentAllocationMode);

module.exports = router;
