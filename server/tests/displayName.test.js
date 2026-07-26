const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const {
  sanitizeDisplayName,
  validateDisplayName,
  MIN_LENGTH,
  MAX_LENGTH,
} = require("../utils/displayName");

describe("displayName", () => {
  test("sanitizeDisplayName strips unsafe characters", () => {
    assert.equal(sanitizeDisplayName("  Alice'; DROP--  "), "Alice DROP--");
    assert.equal(sanitizeDisplayName("Bob<script>"), "Bobscript");
  });

  test("validateDisplayName accepts valid names", () => {
    assert.deepEqual(validateDisplayName("Alice"), { name: "Alice" });
    assert.deepEqual(validateDisplayName("Иван_2"), { name: "Иван_2" });
  });

  test("validateDisplayName rejects too short or too long", () => {
    assert.equal(validateDisplayName("a").error, "invalid_name");
    assert.equal(
      validateDisplayName("x".repeat(MAX_LENGTH + 1)).error,
      "invalid_name",
    );
    assert.equal(MIN_LENGTH, 2);
  });

  test("validateDisplayName rejects SQL-like tokens", () => {
    assert.equal(validateDisplayName("select").error, "invalid_name");
  });

  test("validateDisplayName rejects invalid characters", () => {
    assert.equal(validateDisplayName("user@name").error, "invalid_name");
  });
});
