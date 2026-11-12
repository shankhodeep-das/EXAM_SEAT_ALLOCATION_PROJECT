const express = require("express");

const { authenticates } = require("../middleware/auth.middleware");
const {
  getStudentSeatDetails,
} = require("../controllers/studentSeatLookup.controller");

const router = express.Router();

router.get("/:rollNo/seat", authenticates, getStudentSeatDetails);

module.exports = router;
