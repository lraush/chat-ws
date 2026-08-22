const { describe, test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const prisma = require("../db/prisma");
const {
  publicFriendship,
  sendFriendRequest,
} = require("../services/friend.services");
const { publicRoom } = require("../services/room.services");

describe("friend.services sendFriendRequest", () => {
  const saved = {};

  afterEach(() => {
    if (saved.findFirst) prisma.friendship.findFirst = saved.findFirst;
    if (saved.findUnique) prisma.user.findUnique = saved.findUnique;
    if (saved.create) prisma.friendship.create = saved.create;
  });

  test("rejects adding yourself", async () => {
    const result = await sendFriendRequest("u1", { userId: "u1" });
    assert.equal(result.error, "cannot_add_self");
  });

  test("rejects empty request", async () => {
    const result = await sendFriendRequest("u1", {});
    assert.equal(result.error, "invalid_request");
  });

  test("rejects when friendship already exists", async () => {
    saved.findFirst = prisma.friendship.findFirst.bind(prisma.friendship);
    saved.findUnique = prisma.user.findUnique.bind(prisma.user);

    prisma.user.findUnique = async () => ({ id: "u2", name: "Bob" });
    prisma.friendship.findFirst = async () => ({
      id: "f1",
      status: "PENDING",
      requesterId: "u1",
      addresseeId: "u2",
    });

    const result = await sendFriendRequest("u1", { userId: "u2" });
    assert.equal(result.error, "request_exists");
  });

  test("creates pending request for valid target", async () => {
    saved.findFirst = prisma.friendship.findFirst.bind(prisma.friendship);
    saved.findUnique = prisma.user.findUnique.bind(prisma.user);
    saved.create = prisma.friendship.create.bind(prisma.friendship);

    prisma.user.findUnique = async () => ({ id: "u2", name: "Bob" });
    prisma.friendship.findFirst = async () => null;
    prisma.friendship.create = async ({ data, include }) => ({
      id: "f-new",
      status: "PENDING",
      requesterId: data.requesterId,
      addresseeId: data.addresseeId,
      createdAt: new Date("2026-01-01"),
      requester: include?.requester ? { id: "u1", name: "Alice" } : undefined,
      addressee: include?.addressee ? { id: "u2", name: "Bob" } : undefined,
    });

    const result = await sendFriendRequest("u1", { userId: "u2" });
    assert.equal(result.request.status, "PENDING");
    assert.equal(result.request.direction, "outgoing");
    assert.equal(result.request.user.name, "Bob");
  });
});

describe("friend.services publicFriendship", () => {
  test("marks incoming request for addressee", () => {
    const friendship = {
      id: "f1",
      status: "PENDING",
      requesterId: "u1",
      addresseeId: "u2",
      createdAt: new Date("2026-01-01"),
      requester: { id: "u1", name: "Alice" },
      addressee: { id: "u2", name: "Bob" },
    };

    const view = publicFriendship(friendship, "u2");
    assert.equal(view.direction, "incoming");
    assert.equal(view.user.name, "Alice");
  });

  test("marks outgoing request for requester", () => {
    const friendship = {
      id: "f1",
      status: "PENDING",
      requesterId: "u1",
      addresseeId: "u2",
      createdAt: new Date("2026-01-01"),
      requester: { id: "u1", name: "Alice" },
      addressee: { id: "u2", name: "Bob" },
    };

    const view = publicFriendship(friendship, "u1");
    assert.equal(view.direction, "outgoing");
    assert.equal(view.user.name, "Bob");
  });
});

describe("room.services publicRoom", () => {
  test("returns slug fallback to id", () => {
    const room = publicRoom({
      id: "room1",
      kind: "DIRECT",
      slug: null,
    });
    assert.equal(room.slug, "room1");
    assert.equal(room.kind, "DIRECT");
  });
});
