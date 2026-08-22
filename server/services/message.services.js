const prisma = require("../db/prisma");

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function serializeMessage(message) {
  if (!message) return null;

  return {
    id: message.id,
    content: message.content ?? "",
    kind: message.kind ?? "TEXT",
    fileName: message.fileName ?? null,
    mimeType: message.mimeType ?? null,
    fileSize: message.fileSize ?? null,
    room: message.room,
    createdAt: message.createdAt,
    user: publicUser(message.user),
    hasAttachment: message.kind === "IMAGE" || message.kind === "FILE",
  };
}

async function createMessage(data) {
  const message = await prisma.message.create({
    data,
    include: { user: true },
  });
  return serializeMessage(message);
}

async function createAttachmentMessage(data) {
  const message = await prisma.message.create({
    data,
    include: { user: true },
  });
  return serializeMessage(message);
}

async function getMessages(room) {
  const messages = await prisma.message.findMany({
    where: { room },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  return messages.map(serializeMessage);
}

async function getMessageById(id) {
  const message = await prisma.message.findUnique({
    where: { id },
    include: { user: true },
  });
  return message ? serializeMessage(message) : null;
}

async function getMessageRecordById(id) {
  return prisma.message.findUnique({
    where: { id },
    include: { user: true },
  });
}

module.exports = {
  serializeMessage,
  createMessage,
  createAttachmentMessage,
  getMessages,
  getMessageById,
  getMessageRecordById,
};
