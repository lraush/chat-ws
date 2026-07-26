const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const {
  checkTextWithLanguageTool,
  MAX_TEXT_LENGTH,
} = require("../services/languagetool.service");

describe("languagetool.service", () => {
  test("empty text returns no matches", async () => {
    const result = await checkTextWithLanguageTool("   ", "ru-RU");
    assert.deepEqual(result, { matches: [] });
  });

  test("rejects text over max length", async () => {
    const result = await checkTextWithLanguageTool("a".repeat(MAX_TEXT_LENGTH + 1));
    assert.equal(result.error, "text_too_long");
  });
});
