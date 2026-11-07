require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaNeon } = require("@prisma/adapter-neon");
const { neonConfig } = require("@neondatabase/serverless");
const ws = require("ws");

// Configure WebSocket
neonConfig.webSocketConstructor = ws;

// Connect Prisma to Neon
const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
});

// Create one Prisma Client instance
const prisma = new PrismaClient({
  adapter,
});

module.exports = prisma;