import {
  applyAllMatchesToText,
  isPunctuationMatch,
  prepareSpellResult,
  resolveCorrectedInput,
  sortMatchesPunctuationFirst,
  truncatePreview,
} from "./spellMatches";

describe("spellMatches", () => {
  test("sortMatchesPunctuationFirst puts punctuation first", () => {
    const sorted = sortMatchesPunctuationFirst([
      { replacements: ["word"], ruleCategory: "TYPO" },
      { replacements: [","], ruleCategory: "PUNCTUATION" },
    ]);
    expect(sorted[0].replacements[0]).toBe(",");
  });

  test("isPunctuationMatch detects comma replacement", () => {
    expect(isPunctuationMatch({ replacements: [","] })).toBe(true);
    expect(isPunctuationMatch({ replacements: ["hello"] })).toBe(false);
  });

  test("truncatePreview shortens long text", () => {
    expect(truncatePreview("abc", 10)).toBe("abc");
    expect(truncatePreview("a".repeat(80), 20).endsWith("…")).toBe(true);
  });

  test("applyAllMatchesToText applies every replacement", () => {
    const text = "hello world";
    const next = applyAllMatchesToText(text, [
      { offset: 0, length: 5, replacements: ["Hello"] },
      { offset: 5, length: 6, replacements: [", world"] },
    ]);
    expect(next).toBe("Hello, world");
  });

  test("resolveCorrectedInput prefers API correctedInput", () => {
    expect(
      resolveCorrectedInput("a", { correctedInput: "b", matches: [] }),
    ).toBe("b");
  });

  test("prepareSpellResult builds correctedInput from matches", () => {
    const prepared = prepareSpellResult(
      {
        matches: [
          { offset: 0, length: 5, replacements: ["Hello"] },
          { offset: 5, length: 6, replacements: [", world"] },
        ],
        source: "languagetool",
      },
      "hello world",
    );
    expect(prepared.correctedInput).toBe("Hello, world");
    expect(prepared.matches).toHaveLength(2);
  });
});
