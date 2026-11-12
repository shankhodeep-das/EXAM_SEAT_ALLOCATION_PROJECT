const express = require("express");

const router = express.Router();

const {
  authenticate,
  authorizeAdmin,
} = require("../middleware/auth.middleware");
const {
  studentLogin,
  staffLogin,
  updateStudentPassword,
  updateStaffPassword,
} = require("../controllers/auth.controller");
const {
  getStudentDashboard,
} = require("../controllers/studentDashboard.controller");
const {
  getStaffDashboard,
} = require("../controllers/staffDashboard.controller");
const {
  authenticates,
} = require("../middleware/auth.middleware");

router.get("/me", authenticates, (req, res) => {
  return res.status(200).json({
    authenticated: true,
    user: req.user
  });
});

router.get("/student/dashboard", authenticates, getStudentDashboard);
router.get("/staff/dashboard", authenticates, getStaffDashboard);
router.post("/students/login", studentLogin);
router.put("/student/password", authenticates, updateStudentPassword);
router.put("/staff/password", authenticates, updateStaffPassword);
router.post("/staff/login", staffLogin);

module.exports = router;