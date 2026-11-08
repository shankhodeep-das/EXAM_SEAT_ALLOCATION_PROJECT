const express = require("express");
const cors = require("cors");

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://esap-one.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

const authRoutes = require("./routes/auth.routes");

app.use("/api", authRoutes);
app.use("/api", authRoutes);

module.exports = app;