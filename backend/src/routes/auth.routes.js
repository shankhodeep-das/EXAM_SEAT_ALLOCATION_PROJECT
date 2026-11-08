const express = require("express");

const router = express.Router();

const {
  getStudents,
  createStudent,
} = require("../controllers/student.controller");
const {
  authenticate,
  authorizeAdmin,
} = require("../middleware/auth.middleware");
const {
  studentLogin,
  staffLogin,
} = require("../controllers/auth.controller");


router.post("/students/login", studentLogin);
router.post("/staff/login", staffLogin);

module.exports = router;