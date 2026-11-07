const express = require("express");

const router = express.Router();

const { getStudents } = require("../controllers/student.controller");

router.get("/", getStudents);

module.exports = router;