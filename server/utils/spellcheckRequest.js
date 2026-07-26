const LANGUAGE_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;

function parseSpellcheckRequest(body) {
  const text = body?.text;
  const language = String(body?.language ?? "ru-RU").trim() || "ru-RU";

  if (text == null || typeof text !== "string") {
    return { ok: false, status: 400, error: "text required" };
  }

  if (!LANGUAGE_PATTERN.test(language)) {
    return { ok: false, status: 400, error: "invalid_language" };
  }

  return { ok: true, text, language };
}

module.exports = {
  LANGUAGE_PATTERN,
  parseSpellcheckRequest,
};
