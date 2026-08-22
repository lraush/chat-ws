const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { io: ioClient } = require("socket.io-client");
const prisma = require("../db/prisma");
const { createServer } = require("../createServer");
const { signAccessToken } = require("../services/auth.crypto");

const MEMBER = {
  id: "member_user",
  email: "member@test.local",
  name: "Member",
  isAdmin: false,
  passwordHash: "hash",
};

const OUTSIDER = {
  id: "outsider_user",
  email: "outsider@test.local",
  name: "Outsider",
  isAdmin: false,
  passwordHash: "hash",
};

const DIRECT_ROOM_ID = "direct-room-1";

describe("chat socket room access", () => {
  /** @type {import("http").Server} */
  let server;
  let baseUrl;
  /** @type {import("socket.io").Server} */
  let io;
  const saved = {};

  before(async () => {
    saved.findUniqueUser = prisma.user.findUnique.bind(prisma.user);
    saved.findUniqueRoom = prisma.room.findUnique.bind(prisma.room);
    saved.findUniqueMember = prisma.roomMember.findUnique.bind(prisma.roomMember);
    saved.findManyMessage = prisma.message.findMany.bind(prisma.message);

    prisma.user.findUnique = async ({ where }) => {
      if (where.id === MEMBER.id) return MEMBER;
      if (where.id === OUTSIDER.id) return OUTSIDER;
      return null;
    };

    prisma.room.findUnique = async ({ where }) => {
      const match =
        where.id === DIRECT_ROOM_ID || where.slug === DIRECT_ROOM_ID;
      return match
        ? {
            id: DIRECT_ROOM_ID,
            secretNumber: null,
            kind: "DIRECT",
            slug: DIRECT_ROOM_ID,
          }
        : null;
    };

    prisma.roomMember.findUnique = async ({ where }) => {
      const { roomId, userId } = where.roomId_userId;
      if (roomId === DIRECT_ROOM_ID && userId === MEMBER.id) {
        return { roomId, userId };
      }
      return null;
    };

    prisma.message.findMany = async () => [];

    const created = createServer();
    server = created.server;
    io = created.io;
    await new Promise((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    prisma.user.findUnique = saved.findUniqueUser;
    prisma.room.findUnique = saved.findUniqueRoom;
    prisma.roomMember.findUnique = saved.findUniqueMember;
    prisma.message.findMany = saved.findManyMessage;

    await new Promise((resolve, reject) => {
      io.close((err) => (err ? reject(err) : resolve()));
    });
  });

  test("member can join DIRECT room", async () => {
    const token = signAccessToken(MEMBER);
    const socket = ioClient(baseUrl, {
      auth: { token },
      transports: ["websocket"],
    });

    await new Promise((resolve, reject) => {
      socket.on("connect", resolve);
      socket.on("connect_error", reject);
    });

    const joinResult = await new Promise((resolve, reject) => {
      socket.timeout(5000).emit("join", { room: DIRECT_ROOM_ID }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    assert.equal(joinResult.user.name, MEMBER.name);
    assert.deepEqual(joinResult.messages, []);
    socket.close();
  });

  test("outsider gets forbidden on DIRECT room join", async () => {
    const token = signAccessToken(OUTSIDER);
    const socket = ioClient(baseUrl, {
      auth: { token },
      transports: ["websocket"],
    });

    await new Promise((resolve, reject) => {
      socket.on("connect", resolve);
      socket.on("connect_error", reject);
    });

    const joinResult = await new Promise((resolve, reject) => {
      socket.timeout(5000).emit("join", { room: DIRECT_ROOM_ID }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    assert.equal(joinResult.error, "forbidden");
    socket.close();
  });
});
