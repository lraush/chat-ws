const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { io: ioClient } = require("socket.io-client");
const prisma = require("../db/prisma");
const { createServer } = require("../createServer");
const { signAccessToken } = require("../services/auth.crypto");

const TEST_USER = {
  id: "socket_test_user",
  email: "socket@test.local",
  name: "Socket Tester",
  isAdmin: false,
  passwordHash: "hash",
};

const TEST_ROOM_ID = "socket-test-room";

describe("chat socket", () => {
  /** @type {import("http").Server} */
  let server;
  let baseUrl;
  /** @type {import("socket.io").Server} */
  let io;
  const saved = {};

  before(async () => {
    saved.findUniqueUser = prisma.user.findUnique.bind(prisma.user);
    saved.findUniqueRoom = prisma.room.findUnique.bind(prisma.room);
    saved.findManyMessage = prisma.message.findMany.bind(prisma.message);
    saved.createMessage = prisma.message.create.bind(prisma.message);

    prisma.user.findUnique = async ({ where }) =>
      where.id === TEST_USER.id ? TEST_USER : null;
    prisma.room.findUnique = async ({ where }) => {
      const matchId =
        where.id === TEST_ROOM_ID ||
        (where.slug === TEST_ROOM_ID);
      return matchId
        ? { id: TEST_ROOM_ID, secretNumber: null, kind: "GROUP", slug: TEST_ROOM_ID }
        : null;
    };
    prisma.message.findMany = async () => [];
    prisma.message.create = async ({ data, include }) => ({
      id: "msg_socket_1",
      content: data.content ?? "",
      kind: data.kind ?? "TEXT",
      fileName: data.fileName ?? null,
      storedName: data.storedName ?? null,
      mimeType: data.mimeType ?? null,
      fileSize: data.fileSize ?? null,
      room: data.room,
      userId: data.userId,
      createdAt: new Date("2026-01-01T12:00:00.000Z"),
      user: include?.user ? TEST_USER : undefined,
    });

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
    prisma.message.findMany = saved.findManyMessage;
    prisma.message.create = saved.createMessage;

    await new Promise((resolve, reject) => {
      io.close((err) => (err ? reject(err) : resolve()));
    });
  });

  test("join room and send message via socket", async () => {
    const token = signAccessToken(TEST_USER);
    const socket = ioClient(baseUrl, {
      auth: { token },
      transports: ["websocket"],
    });

    await new Promise((resolve, reject) => {
      socket.on("connect", resolve);
      socket.on("connect_error", reject);
    });

    const joinResult = await new Promise((resolve, reject) => {
      socket.timeout(5000).emit("join", { room: TEST_ROOM_ID }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    assert.equal(joinResult.user.name, TEST_USER.name);
    assert.deepEqual(joinResult.messages, []);

    const sendResult = await new Promise((resolve, reject) => {
      socket
        .timeout(5000)
        .emit("sendMessage", { content: "hello socket" }, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
    });

    assert.equal(sendResult.message.content, "hello socket");
    assert.equal(sendResult.message.user.name, TEST_USER.name);

    socket.close();
  });
});
