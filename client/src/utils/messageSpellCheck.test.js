import { checkMessageSpelling } from "./messageSpellCheck";
import { proofreadWithEdge } from "./proofreader";
import { spellCheckText } from "./api";

jest.mock("./proofreader", () => ({
  proofreadWithEdge: jest.fn(),
  getProofreaderAvailability: jest.fn(),
  isProofreaderUsable: jest.fn(),
}));

jest.mock("./api", () => ({
  spellCheckText: jest.fn(),
}));

describe("messageSpellCheck", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("skips proofreading when text has no letters", async () => {
    const result = await checkMessageSpelling("123 !!!");
    expect(result.matches).toEqual([]);
    expect(result.source).toBe("none");
    expect(proofreadWithEdge).not.toHaveBeenCalled();
    expect(spellCheckText).not.toHaveBeenCalled();
  });

  test("uses Edge proofreader when it returns a result", async () => {
    proofreadWithEdge.mockResolvedValue({
      matches: [{ offset: 0, length: 5, replacements: ["Hello"] }],
      correctedInput: "Hello",
      source: "proofreader",
    });

    const result = await checkMessageSpelling("hello");
    expect(proofreadWithEdge).toHaveBeenCalledWith("hello", "ru-RU");
    expect(spellCheckText).not.toHaveBeenCalled();
    expect(result.source).toBe("proofreader");
    expect(result.correctedInput).toBe("Hello");
  });

  test("falls back to LanguageTool when proofreader unavailable", async () => {
    proofreadWithEdge.mockResolvedValue(null);
    spellCheckText.mockResolvedValue({
      matches: [{ offset: 0, length: 5, replacements: ["Hello"] }],
    });

    const result = await checkMessageSpelling("hello", "en-US");
    expect(spellCheckText).toHaveBeenCalledWith("hello", "en-US");
    expect(result.source).toBe("languagetool");
    expect(result.correctedInput).toBe("Hello");
  });
});
