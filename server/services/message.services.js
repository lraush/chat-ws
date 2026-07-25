const prisma = require("../db/prisma");

//CREATE
async function createMessage(data) {
  return prisma.message.create({
    data,
    include: { user: true },
  });
}

//READ
async function getMessages(room) {
  return prisma.message.findMany({
    where: { room },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
}

module.exports = {
  createMessage,
  getMessages,
};
