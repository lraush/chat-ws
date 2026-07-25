const prisma = require("../db/prisma");

async function createRoom() {
  return prisma.room.create({ data: {} });
}

async function getRoomById(id) {
  return prisma.room.findUnique({ where: { id } });
}

module.exports = {
  createRoom,
  getRoomById,
};
