const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const studentRoutes = require("./routes/student.routes");

app.use("/api/students", studentRoutes);

module.exports = app;