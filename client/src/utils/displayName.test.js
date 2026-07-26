import {
  DISPLAY_NAME_MAX,
  DISPLAY_NAME_MIN,
  sanitizeDisplayName,
  validateDisplayName,
} from "./displayName";

describe("displayName", () => {
  test("sanitizeDisplayName strips unsafe characters", () => {
    expect(sanitizeDisplayName("  Alice'; DROP--  ")).toBe("Alice DROP--");
  });

  test("validateDisplayName accepts valid names", () => {
    expect(validateDisplayName("Alice")).toEqual({ name: "Alice" });
    expect(validateDisplayName("Иван_2")).toEqual({ name: "Иван_2" });
  });

  test("validateDisplayName rejects too short", () => {
    expect(validateDisplayName("a").error).toBe("invalid_name");
    expect(DISPLAY_NAME_MIN).toBe(2);
  });

  test("validateDisplayName rejects too long", () => {
    expect(validateDisplayName("x".repeat(DISPLAY_NAME_MAX + 1)).error).toBe(
      "invalid_name",
    );
  });

  test("validateDisplayName rejects invalid characters", () => {
    expect(validateDisplayName("user@name").error).toBe("invalid_name");
  });
});
