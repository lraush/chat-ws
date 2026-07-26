const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { parseSpellcheckRequest } = require("../utils/spellcheckRequest");

describe("spellcheckRequest", () => {
  test("requires text string", () => {
    assert.deepEqual(parseSpellcheckRequest({}), {
      ok: false,
      status: 400,
      error: "text required",
    });
    assert.deepEqual(parseSpellcheckRequest({ text: 1 }), {
      ok: false,
      status: 400,
      error: "text required",
    });
  });

  test("rejects invalid language tag", () => {
    assert.deepEqual(
      parseSpellcheckRequest({ text: "hi", language: "not-valid" }),
      { ok: false, status: 400, error: "invalid_language" },
    );
  });

  test("accepts valid body with defaults", () => {
    assert.deepEqual(parseSpellcheckRequest({ text: "  hi  " }), {
      ok: true,
      text: "  hi  ",
      language: "ru-RU",
    });
    assert.deepEqual(parseSpellcheckRequest({ text: "hi", language: "en-US" }), {
      ok: true,
      text: "hi",
      language: "en-US",
    });
  });
});
