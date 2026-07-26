const PUNCTUATION_RE = /^[\s.,!?;:—–\-«»""''…]+$/u;

export function isPunctuationMatch(match) {
  const replacement = match?.replacements?.[0] ?? "";
  if (replacement && PUNCTUATION_RE.test(replacement)) {
    return true;
  }
  const category = String(match?.ruleCategory ?? "").toUpperCase();
  if (category.includes("PUNCT")) {
    return true;
  }
  return false;
}

export function sortMatchesPunctuationFirst(matches) {
  if (!matches?.length) return [];
  return [...matches].sort((a, b) => {
    const pa = isPunctuationMatch(a);
    const pb = isPunctuationMatch(b);
    if (pa && !pb) return -1;
    if (!pa && pb) return 1;
    return 0;
  });
}

/** Apply first replacement for each match (end → start so offsets stay valid). */
export function applyAllMatchesToText(text, matches) {
  const withRepl = (matches ?? []).filter((m) => m.replacements?.[0]);
  if (!withRepl.length) return String(text ?? "");

  let out = String(text ?? "");
  const byOffset = [...withRepl].sort((a, b) => b.offset - a.offset);
  for (const m of byOffset) {
    const rep = m.replacements[0];
    if (m.offset < 0 || m.offset + m.length > out.length) continue;
    out = out.slice(0, m.offset) + rep + out.slice(m.offset + m.length);
  }
  return out;
}

export function resolveCorrectedInput(text, result) {
  const base = String(text ?? "");
  const fromApi = result?.correctedInput;
  if (fromApi && fromApi !== base) return fromApi;
  const fromMatches = applyAllMatchesToText(base, result?.matches);
  if (fromMatches !== base) return fromMatches;
  return fromApi ?? base;
}

export function prepareSpellResult(result, text, maxMatches = 8) {
  const matches = sortMatchesPunctuationFirst(result?.matches ?? []).slice(
    0,
    maxMatches,
  );
  const correctedInput = resolveCorrectedInput(text, { ...result, matches });
  return { ...result, matches, correctedInput };
}

export function truncatePreview(text, maxLen = 72) {
  const value = String(text ?? "");
  if (value.length <= maxLen) return value;
  return `${value.slice(0, maxLen - 1)}…`;
}
