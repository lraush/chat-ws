import {
  encryptMessage,
  decryptMessage,
  normalizeRotations,
  looksLikeCipherMismatch,
} from "./cipher";

describe("cipher", () => {
  test("encrypt and decrypt roundtrip for latin and cyrillic", () => {
    const plain = "Hello, мир!";
    const encrypted = encryptMessage(plain, 3);
    expect(encrypted).not.toBe(plain);
    expect(decryptMessage(encrypted, 3)).toBe(plain);
  });

  test("zero rotations leave text unchanged", () => {
    expect(encryptMessage("test", 0)).toBe("test");
    expect(decryptMessage("test", 0)).toBe("test");
  });

  test("normalizeRotations clamps invalid values", () => {
    expect(normalizeRotations(-1)).toBe(0);
    expect(normalizeRotations("99999")).toBe(9999);
    expect(normalizeRotations("12")).toBe(12);
  });

  test("looksLikeCipherMismatch flags garbled text", () => {
    expect(looksLikeCipherMismatch("Привет, мир!")).toBe(false);
    expect(looksLikeCipherMismatch("Ø§Ø±Ø¨Ø±Ø§ØªØ§Ø§")).toBe(true);
  });
});
