import {
  DEFAULT_ORNAMENT,
  DEFAULT_THEME,
  ORNAMENTS,
  THEMES,
  isValidOrnamentId,
  isValidThemeId,
} from "./theme";

describe("theme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-ornament");
  });

  test("lists pastel themes and vivid", () => {
    expect(THEMES.length).toBe(6);
    expect(THEMES[0].id).toBe("lavender");
    expect(THEMES.some((theme) => theme.id === "vivid")).toBe(true);
  });

  test("lists ornaments including none", () => {
    expect(ORNAMENTS.length).toBeGreaterThanOrEqual(6);
    expect(ORNAMENTS[0].id).toBe("none");
    expect(ORNAMENTS.some((ornament) => ornament.id === "lace")).toBe(true);
  });

  test("default theme is lavender and ornament is none", () => {
    expect(DEFAULT_THEME).toBe("lavender");
    expect(DEFAULT_ORNAMENT).toBe("none");
  });

  test("isValidThemeId validates known themes", () => {
    expect(isValidThemeId("rose")).toBe(true);
    expect(isValidThemeId("unknown")).toBe(false);
  });

  test("isValidOrnamentId validates known ornaments", () => {
    expect(isValidOrnamentId("dots")).toBe(true);
    expect(isValidOrnamentId("unknown")).toBe(false);
  });
});
