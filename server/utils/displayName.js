const MIN_LENGTH = 2;
const MAX_LENGTH = 100;

const UNSAFE_CHARS = /['"`;\\<>]/g;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const SQL_TOKEN = /\b(select|insert|update|delete|drop|union|exec|execute)\b/i;

/** Allowed: letters, digits, space, dot, underscore, hyphen. */
const ALLOWED_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}\s._-]*$/u;

function sanitizeDisplayName(raw) {
  let value = String(raw ?? "")
    .replace(CONTROL_CHARS, "")
    .replace(UNSAFE_CHARS, "")
    .replace(/\s+/g, " ")
    .trim();
  return value;
}

function validateDisplayName(raw) {
  const name = sanitizeDisplayName(raw);
  if (name.length < MIN_LENGTH || name.length > MAX_LENGTH) {
    return { error: "invalid_name" };
  }
  if (!ALLOWED_PATTERN.test(name)) {
    return { error: "invalid_name" };
  }
  if (SQL_TOKEN.test(name)) {
    return { error: "invalid_name" };
  }
  return { name };
}

module.exports = {
  MIN_LENGTH,
  MAX_LENGTH,
  sanitizeDisplayName,
  validateDisplayName,
};
