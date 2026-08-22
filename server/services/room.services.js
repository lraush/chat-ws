const prisma = require("../db/prisma");

async function createRoom({ createdById } = {}) {
  const room = await prisma.room.create({
    data: {
      kind: "GROUP",
      slug: undefined,
      createdById: createdById ?? null,
    },
  });
  return prisma.room.update({
    where: { id: room.id },
    data: { slug: room.id },
  });
}

async function getRoomById(id) {
  return prisma.room.findUnique({ where: { id } });
}

async function getRoomBySlug(slug) {
  return prisma.room.findUnique({ where: { slug } });
}

async function getRoomByIdentifier(identifier) {
  const key = String(identifier ?? "").trim();
  if (!key) return null;

  const byId = await getRoomById(key);
  if (byId) return byId;

  return getRoomBySlug(key);
}

async function isRoomMember(roomId, userId) {
  const member = await prisma.roomMember.findUnique({
    where: {
      roomId_userId: { roomId, userId },
    },
  });
  return Boolean(member);
}

async function canAccessRoom(room, userId) {
  if (!room || !userId) return false;
  if (room.kind === "GROUP") return true;
  return isRoomMember(room.id, userId);
}

function publicRoom(room) {
  if (!room) return null;
  return {
    id: room.id,
    kind: room.kind,
    slug: room.slug ?? room.id,
  };
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

async function findDirectRoomBetween(userIdA, userIdB) {
  const rooms = await prisma.room.findMany({
    where: {
      kind: "DIRECT",
      AND: [
        { members: { some: { userId: userIdA } } },
        { members: { some: { userId: userIdB } } },
      ],
    },
    include: {
      members: true,
    },
  });

  return (
    rooms.find(
      (room) =>
        room.members.length === 2 &&
        room.members.some((m) => m.userId === userIdA) &&
        room.members.some((m) => m.userId === userIdB),
    ) ?? null
  );
}

async function createDirectRoom(userIdA, userIdB) {
  const existing = await findDirectRoomBetween(userIdA, userIdB);
  if (existing) return existing;

  const room = await prisma.room.create({
    data: {
      kind: "DIRECT",
      createdById: userIdA,
      members: {
        create: [{ userId: userIdA }, { userId: userIdB }],
      },
    },
  });

  return prisma.room.update({
    where: { id: room.id },
    data: { slug: room.id },
  });
}

module.exports = {
  createRoom,
  getRoomById,
  getRoomBySlug,
  getRoomByIdentifier,
  isRoomMember,
  canAccessRoom,
  publicRoom,
  setRoomSecretNumber,
  clampSecretNumber,
  findDirectRoomBetween,
  createDirectRoom,
};
