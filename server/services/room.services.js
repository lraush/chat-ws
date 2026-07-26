const prisma = require("../db/prisma");

async function createRoom() {
  return prisma.room.create({ data: {} });
}

async function getRoomById(id) {
  return prisma.room.findUnique({ where: { id } });
}

function clampSecretNumber(value) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, 9999);
}

async function setRoomSecretNumber(roomId, secretNumber) {
  const id = String(roomId ?? "").trim();
  if (!id) {
    throw new Error("room id required");
  }

  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) {
    return null;
  }

  return prisma.room.update({
    where: { id },
    data: { secretNumber: clampSecretNumber(secretNumber) },
  });
}

module.exports = {
  createRoom,
  getRoomById,
  setRoomSecretNumber,
  clampSecretNumber,
};
