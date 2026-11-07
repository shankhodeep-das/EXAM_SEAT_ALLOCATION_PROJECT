const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
}));
app.use(express.json());

const studentRoutes = require("./routes/student.routes");

app.use("/api/students", studentRoutes);

module.exports = app;