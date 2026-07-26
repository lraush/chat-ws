import {
  mapProofreaderCorrections,
  mapProofreaderLanguages,
} from "./proofreader";

describe("proofreader", () => {
  test("mapProofreaderLanguages uses primary subtag", () => {
    expect(mapProofreaderLanguages("ru-RU")).toEqual(["ru"]);
    expect(mapProofreaderLanguages("en-US")).toEqual(["en"]);
  });

  test("mapProofreaderCorrections maps indices to match shape", () => {
    const matches = mapProofreaderCorrections([
      { startIndex: 2, endIndex: 4, correction: "test" },
    ]);
    expect(matches).toHaveLength(1);
    expect(matches[0].offset).toBe(2);
    expect(matches[0].length).toBe(3);
    expect(matches[0].replacements).toEqual(["test"]);
  });

  test("mapProofreaderCorrections handles empty list", () => {
    expect(mapProofreaderCorrections([])).toEqual([]);
  });
});
