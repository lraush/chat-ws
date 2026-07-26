const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeEmail,
  hashPassword,
  verifyPassword,
  signAccessToken,
  verifyAccessToken,
  publicUser,
} = require("../services/auth.crypto");

describe("auth.crypto", () => {
  test("normalizeEmail lowercases and trims", () => {
    assert.equal(normalizeEmail("  User@Example.COM "), "user@example.com");
  });

  test("hashPassword and verifyPassword", async () => {
    const hash = await hashPassword("secret123");
    assert.notEqual(hash, "secret123");
    assert.equal(await verifyPassword("secret123", hash), true);
    assert.equal(await verifyPassword("wrong", hash), false);
  });

  test("signAccessToken and verifyAccessToken", () => {
    const user = {
      id: "user_1",
      email: "a@b.com",
      isAdmin: false,
    };
    const token = signAccessToken(user);
    const payload = verifyAccessToken(token);
    assert.equal(payload.sub, user.id);
    assert.equal(payload.email, user.email);
    assert.equal(payload.isAdmin, false);
    assert.equal(verifyAccessToken("not-a-token"), null);
  });

  test("publicUser omits sensitive fields", () => {
    assert.deepEqual(
      publicUser({
        id: "1",
        email: "a@b.com",
        name: "Ann",
        isAdmin: true,
        passwordHash: "hidden",
      }),
      { id: "1", email: "a@b.com", name: "Ann", isAdmin: true },
    );
  });
});
