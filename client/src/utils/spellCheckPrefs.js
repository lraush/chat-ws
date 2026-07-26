const SPELLCHECK_KEY = "chatSpellCheckEnabled";
const SPELL_LANGUAGE_KEY = "chatSpellLanguage";

export function isSpellCheckEnabled() {
  return sessionStorage.getItem(SPELLCHECK_KEY) === "1";
}

export function setSpellCheckEnabled(enabled) {
  sessionStorage.setItem(SPELLCHECK_KEY, enabled ? "1" : "0");
}

export function getSpellLanguage() {
  return sessionStorage.getItem(SPELL_LANGUAGE_KEY)?.trim() || "ru-RU";
}

export function setSpellLanguage(language) {
  sessionStorage.setItem(SPELL_LANGUAGE_KEY, language);
}

/** Text worth proofreading (has letters). */
export function shouldRunSpellCheck(text) {
  return /[\p{L}]/u.test(String(text ?? ""));
}
