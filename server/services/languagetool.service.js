const DEFAULT_BASE_URL = "https://api.languagetool.org/v2";
const MAX_TEXT_LENGTH = 20_000;

function getCheckUrl() {
  const base = process.env.LANGUAGETOOL_API_URL?.trim() || DEFAULT_BASE_URL;
  return `${base.replace(/\/$/, "")}/check`;
}

function simplifyMatch(match) {
  return {
    message: match.message,
    offset: match.offset,
    length: match.length,
    replacements: (match.replacements ?? [])
      .slice(0, 5)
      .map((r) => r.value)
      .filter(Boolean),
    context: match.context?.text ?? "",
    ruleCategory: match.rule?.category?.id ?? match.rule?.issueType ?? "",
  };
}

async function checkTextWithLanguageTool(text, language) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) {
    return { matches: [] };
  }
  if (trimmed.length > MAX_TEXT_LENGTH) {
    return { error: "text_too_long" };
  }

  const params = new URLSearchParams();
  params.set("text", trimmed);
  params.set("language", language || "ru-RU");
  params.set("enabledOnly", "false");

  const username = process.env.LANGUAGETOOL_USERNAME?.trim();
  const apiKey = process.env.LANGUAGETOOL_API_KEY?.trim();
  if (username) params.set("username", username);
  if (apiKey) params.set("apiKey", apiKey);

  let res;
  try {
    res = await fetch(getCheckUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params.toString(),
    });
  } catch {
    return { error: "network" };
  }

  if (res.status === 429) {
    return { error: "rate_limit" };
  }

  if (!res.ok) {
    return { error: "service_unavailable" };
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return { error: "invalid_response" };
  }

  const matches = (data.matches ?? []).map(simplifyMatch);
  return { matches, language: data.language?.code ?? language };
}

module.exports = {
  checkTextWithLanguageTool,
  MAX_TEXT_LENGTH,
};
