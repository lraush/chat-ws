import { spellCheckText } from "./api";
import { proofreadWithEdge } from "./proofreader";
import { prepareSpellResult } from "./spellMatches";
import { shouldRunSpellCheck } from "./spellCheckPrefs";

/**
 * Prefer Edge Proofreader (on-device). Fall back to LanguageTool via server.
 */
export async function checkMessageSpelling(text, language = "ru-RU") {
  if (!shouldRunSpellCheck(text)) {
    return { matches: [], source: "none" };
  }

  try {
    const local = await proofreadWithEdge(text, language);
    if (local !== null) {
      return prepareSpellResult(local, text);
    }
  } catch {
    /* fall through to LanguageTool */
  }

  const remote = await spellCheckText(text, language);
  return prepareSpellResult({ ...remote, source: "languagetool" }, text);
}

export { getProofreaderAvailability, isProofreaderUsable } from "./proofreader";
