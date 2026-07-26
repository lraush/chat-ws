const ALPHABETS = [
  {
    lower: "abcdefghijklmnopqrstuvwxyz",
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  },
  {
    lower: "абвгдежзийклмнопрстуфхцчшщъыьэюя",
    upper: "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ",
  },
  { lower: "ё", upper: "Ё" },
];

function shiftChar(char, forward) {
  for (const alpha of ALPHABETS) {
    const lowerIdx = alpha.lower.indexOf(char);
    if (lowerIdx !== -1) {
      const len = alpha.lower.length;
      const next = forward
        ? (lowerIdx + 1) % len
        : (lowerIdx - 1 + len) % len;
      return alpha.lower[next];
    }

    const upperIdx = alpha.upper.indexOf(char);
    if (upperIdx !== -1) {
      const len = alpha.upper.length;
      const next = forward
        ? (upperIdx + 1) % len
        : (upperIdx - 1 + len) % len;
      return alpha.upper[next];
    }
  }
  return char;
}

function applyRotations(text, count, forward) {
  let out = text;
  for (let i = 0; i < count; i += 1) {
    out = Array.from(out, (char) => shiftChar(char, forward)).join("");
  }
  return out;
}

function normalizeRotations(value) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, 9999);
}

function decryptMessage(cipher, rotations) {
  const steps = normalizeRotations(rotations);
  if (steps === 0 || !cipher) return cipher;
  return applyRotations(cipher, steps, false);
}

module.exports = {
  decryptMessage,
  normalizeRotations,
};
