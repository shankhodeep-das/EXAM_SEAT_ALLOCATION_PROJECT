const prisma = require("./src/config/prisma");

async function testConnection() {
  try {
    await prisma.$connect();

    const students = await prisma.student.findMany();

    console.log("Connected to Neon successfully!");
    console.log("Students:", students);
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();