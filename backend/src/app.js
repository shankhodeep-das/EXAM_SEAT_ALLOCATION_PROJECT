const express = require("express");
const cors = require("cors");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://your-frontend-name.vercel.app"
];

app.use(cors({
  origin: allowedOrigins
}));
app.use(express.json());

const authRoutes = require("./routes/auth.routes");

app.use("/api", authRoutes);
app.use("/api", authRoutes);

module.exports = app;