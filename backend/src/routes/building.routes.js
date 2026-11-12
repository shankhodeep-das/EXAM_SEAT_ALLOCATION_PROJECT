const express = require("express");

const { authenticates } = require("../middleware/auth.middleware");
const {
  addBuildingRooms,
  getBuildings,
} = require("../controllers/building.controller");

const router = express.Router();

router.get("/", authenticates, getBuildings);
router.post("/", authenticates, addBuildingRooms);

module.exports = router;
