/**
 * Decrypt a stored message using the room's secretNumber from the DB.
 *
 * Usage (from server/):
 *   node scripts/decrypt-room-messages.js <roomId>
 */
require("dotenv").config();

const prisma = require("../db/prisma");
const { decryptMessage } = require("../utils/cipher");

async function main() {
  const roomId = process.argv[2]?.trim();
  if (!roomId) {
    console.error("Usage: node scripts/decrypt-room-messages.js <roomId>");
    process.exit(1);
  }

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) {
    console.error("Room not found:", roomId);
    process.exit(1);
  }

  const rotations = room.secretNumber ?? 0;
  console.log(`Room ${roomId}, secretNumber=${rotations}\n`);

  const messages = await prisma.message.findMany({
    where: { room: roomId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  for (const msg of messages) {
    const plain = decryptMessage(msg.content, rotations);
    const who = msg.user?.name ?? msg.userId;
    console.log(`[${msg.createdAt.toISOString()}] ${who}:`);
    console.log(plain);
    console.log("");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
