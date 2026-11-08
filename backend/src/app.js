const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
}));
app.use(express.json());

const authRoutes = require("./routes/auth.routes");

app.use("/api", authRoutes);
app.use("/api", authRoutes);

module.exports = app;