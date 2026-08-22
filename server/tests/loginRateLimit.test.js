const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  loginRateLimit,
  resetLoginRateLimits,
} = require("../middleware/loginRateLimit");

function mockReqRes(ip = "127.0.0.1", email = "a@b.com") {
  let statusCode = 200;
  let body = null;
  const req = {
    ip,
    body: { email },
    socket: { remoteAddress: ip },
  };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      body = payload;
      return this;
    },
  };
  return {
    req,
    res,
    get result() {
      return { statusCode, body };
    },
  };
}

describe("loginRateLimit", () => {
  beforeEach(() => {
    resetLoginRateLimits();
  });

  test("allows first attempts and blocks after limit", () => {
    for (let i = 0; i < 5; i += 1) {
      const { req, res, result } = mockReqRes();
      let called = false;
      loginRateLimit(req, res, () => {
        called = true;
      });
      assert.equal(called, true);
      assert.equal(result.statusCode, 200);
    }

    const blocked = mockReqRes();
    let called = false;
    loginRateLimit(blocked.req, blocked.res, () => {
      called = true;
    });
    assert.equal(called, false);
    assert.equal(blocked.result.statusCode, 429);
    assert.equal(blocked.result.body.error, "rate_limit");
  });
});
