const { test, describe, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

describe("config/env", () => {
  /** @type {NodeJS.ProcessEnv} */
  let saved;

  beforeEach(() => {
    saved = { ...process.env };
  });

  afterEach(() => {
    process.env = saved;
    delete require.cache[require.resolve("../config/env")];
  });

  test("getCorsOrigins defaults to localhost in development", () => {
    delete process.env.NODE_ENV;
    delete process.env.CORS_ORIGINS;
    delete process.env.CLIENT_ORIGIN;
    const { getCorsOrigins } = require("../config/env");
    assert.deepEqual(getCorsOrigins(), [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ]);
  });

  test("validateEnv requires DATABASE_URL", () => {
    delete process.env.DATABASE_URL;
    delete process.env.NODE_ENV;
    const { validateEnv } = require("../config/env");
    assert.throws(() => validateEnv(), /DATABASE_URL/);
  });

  test("validateEnv rejects weak JWT in production", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "mysql://localhost/test";
    process.env.CLIENT_ORIGIN = "https://app.example.com";
    process.env.JWT_SECRET = "change-me-in-production";
    const { validateEnv } = require("../config/env");
    assert.throws(() => validateEnv(), /JWT_SECRET/);
  });
});
