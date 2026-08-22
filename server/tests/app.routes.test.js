const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../app");

describe("HTTP protected routes", () => {
  /** @type {import("http").Server} */
  let server;
  let baseUrl;

  before(async () => {
    const app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, "127.0.0.1", resolve);
    });
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  test("POST /api/rooms without token returns 401", async () => {
    const res = await fetch(`${baseUrl}/api/rooms`, { method: "POST" });
    assert.equal(res.status, 401);
  });

  test("GET /api/rooms/:id without token returns 401", async () => {
    const res = await fetch(`${baseUrl}/api/rooms/test-room`);
    assert.equal(res.status, 401);
  });

  test("GET /api/friends without token returns 401", async () => {
    const res = await fetch(`${baseUrl}/api/friends`);
    assert.equal(res.status, 401);
  });

  test("GET /api/users/search without token returns 401", async () => {
    const res = await fetch(`${baseUrl}/api/users/search?q=alice`);
    assert.equal(res.status, 401);
  });

  test("POST /api/friends/request without token returns 401", async () => {
    const res = await fetch(`${baseUrl}/api/friends/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "u1" }),
    });
    assert.equal(res.status, 401);
  });
});
