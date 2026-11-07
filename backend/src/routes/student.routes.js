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


// GET all students
router.get("/", getStudents);
router.post("/login", studentLogin);
// POST a new student
router.post("/", authenticate, authorizeAdmin, createStudent);

module.exports = router;