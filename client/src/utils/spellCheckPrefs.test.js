import {
  getSpellLanguage,
  isSpellCheckEnabled,
  setSpellCheckEnabled,
  setSpellLanguage,
  shouldRunSpellCheck,
} from "./spellCheckPrefs";

describe("spellCheckPrefs", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test("spell check toggle persists in sessionStorage", () => {
    expect(isSpellCheckEnabled()).toBe(false);
    setSpellCheckEnabled(true);
    expect(isSpellCheckEnabled()).toBe(true);
    setSpellCheckEnabled(false);
    expect(isSpellCheckEnabled()).toBe(false);
  });

  test("getSpellLanguage defaults to ru-RU", () => {
    expect(getSpellLanguage()).toBe("ru-RU");
    setSpellLanguage("en-US");
    expect(getSpellLanguage()).toBe("en-US");
  });

  test("shouldRunSpellCheck requires letters", () => {
    expect(shouldRunSpellCheck("123 !!!")).toBe(false);
    expect(shouldRunSpellCheck("hi")).toBe(true);
    expect(shouldRunSpellCheck("привет")).toBe(true);
  });
});
