const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

if (typeof prisma.room?.create !== "function") {
  console.error(
    "[prisma] Client is out of date (Room model missing). Run: npx prisma generate",
  );
  process.exit(1);
}

module.exports = prisma;
