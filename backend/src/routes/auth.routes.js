const express = require("express");

const router = express.Router();

const {
  authenticate,
  authorizeAdmin,
} = require("../middleware/auth.middleware");
const {
  studentLogin,
  staffLogin,
} = require("../controllers/auth.controller");
const {
  authenticates,
} = require("../middleware/auth.middleware");

router.get("/me", authenticates, (req, res) => {
  return res.status(200).json({
    authenticated: true,
    user: req.user
  });
});

router.post("/students/login", studentLogin);
router.post("/staff/login", staffLogin);

module.exports = router;