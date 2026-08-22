const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../app");

describe("HTTP API smoke", () => {
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

  test("GET /api/auth/me without token returns 401", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(res.status, 401);
  });

  test("POST /api/auth/login without body returns 400", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 400);
  });

  test("GET /api/health returns ok or db down", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    const body = await res.json();
    assert.equal(typeof body.ok, "boolean");
    if (body.ok) {
      assert.equal(res.status, 200);
      assert.equal(body.db, "up");
    } else {
      assert.equal(res.status, 503);
      assert.equal(body.db, "down");
    }
  });

  test("POST /api/spellcheck without token returns 401", async () => {
    const res = await fetch(`${baseUrl}/api/spellcheck`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "test" }),
    });
    assert.equal(res.status, 401);
  });
});
