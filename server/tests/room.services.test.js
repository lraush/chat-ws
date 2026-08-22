const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const prisma = require("../db/prisma");
const {
  clampSecretNumber,
  canAccessRoom,
  publicRoom,
} = require("../services/room.services");

describe("room.services clampSecretNumber", () => {
  test("clamps negative and non-numeric values to 0", () => {
    assert.equal(clampSecretNumber(-5), 0);
    assert.equal(clampSecretNumber("abc"), 0);
    assert.equal(clampSecretNumber(null), 0);
  });

  test("clamps values above 9999", () => {
    assert.equal(clampSecretNumber(10000), 9999);
    assert.equal(clampSecretNumber("12345"), 9999);
  });

  test("keeps valid values", () => {
    assert.equal(clampSecretNumber(42), 42);
    assert.equal(clampSecretNumber("007"), 7);
  });
});

describe("room.services canAccessRoom", () => {
  const savedFindUnique = prisma.roomMember.findUnique.bind(prisma.roomMember);

  test("allows any authenticated user for GROUP rooms", async () => {
    const allowed = await canAccessRoom(
      { id: "g1", kind: "GROUP" },
      "user1",
    );
    assert.equal(allowed, true);
  });

  test("denies DIRECT room when user is not a member", async () => {
    prisma.roomMember.findUnique = async () => null;
    const allowed = await canAccessRoom(
      { id: "d1", kind: "DIRECT" },
      "outsider",
    );
    assert.equal(allowed, false);
    prisma.roomMember.findUnique = savedFindUnique;
  });

  test("allows DIRECT room for members", async () => {
    prisma.roomMember.findUnique = async () => ({ roomId: "d1", userId: "u1" });
    const allowed = await canAccessRoom(
      { id: "d1", kind: "DIRECT" },
      "u1",
    );
    assert.equal(allowed, true);
    prisma.roomMember.findUnique = savedFindUnique;
  });

  test("returns false for missing room or user", async () => {
    assert.equal(await canAccessRoom(null, "u1"), false);
    assert.equal(await canAccessRoom({ id: "g1", kind: "GROUP" }, ""), false);
  });
});

describe("room.services publicRoom", () => {
  test("uses id as slug fallback", () => {
    assert.deepEqual(publicRoom({ id: "abc", kind: "GROUP", slug: null }), {
      id: "abc",
      kind: "GROUP",
      slug: "abc",
    });
  });
});
