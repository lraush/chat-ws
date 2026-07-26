export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 100;

const UNSAFE_CHARS = /['"`;\\<>]/g;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const SQL_TOKEN = /\b(select|insert|update|delete|drop|union|exec|execute)\b/i;
const ALLOWED_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}\s._-]*$/u;

export function sanitizeDisplayName(raw) {
  let value = String(raw ?? "")
    .replace(CONTROL_CHARS, "")
    .replace(UNSAFE_CHARS, "")
    .replace(/\s+/g, " ")
    .trim();
  return value;
}

export function validateDisplayName(raw) {
  const name = sanitizeDisplayName(raw);
  if (name.length < DISPLAY_NAME_MIN || name.length > DISPLAY_NAME_MAX) {
    return { error: "invalid_name", name };
  }
  if (!ALLOWED_PATTERN.test(name)) {
    return { error: "invalid_name", name };
  }
  if (SQL_TOKEN.test(name)) {
    return { error: "invalid_name", name };
  }
  return { name };
}
