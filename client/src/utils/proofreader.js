/**
 * Microsoft Edge Proofreader API (on-device).
 * @see https://learn.microsoft.com/en-us/microsoft-edge/web-platform/proofreader-api
 */

/** @param {string} language e.g. ru-RU */
export function mapProofreaderLanguages(language) {
  const primary = String(language ?? "ru-RU").split("-")[0].toLowerCase();
  return primary ? [primary] : ["ru"];
}

/**
 * @param {Array<{ startIndex: number, endIndex: number, correction: string }>} corrections
 */
export function mapProofreaderCorrections(corrections) {
  if (!corrections?.length) {
    return [];
  }

  return corrections.map((item) => {
    const offset = item.startIndex;
    const length = Math.max(0, item.endIndex - item.startIndex + 1);
    return {
      offset,
      length,
      message: `Suggestion: ${item.correction}`,
      replacements: item.correction ? [item.correction] : [],
    };
  });
}

let sessionPromise = null;
let sessionLanguagesKey = "";

function getProofreaderGlobal() {
  if (typeof window !== "undefined" && window.Proofreader) {
    return window.Proofreader;
  }
  return null;
}

export async function getProofreaderAvailability() {
  const Proofreader = getProofreaderGlobal();
  if (!Proofreader) {
    return "unsupported";
  }
  try {
    return await Proofreader.availability();
  } catch {
    return "unavailable";
  }
}

export function isProofreaderUsable(availability) {
  return (
    availability === "available" ||
    availability === "downloadable" ||
    availability === "downloading"
  );
}

async function createSession(language) {
  const Proofreader = getProofreaderGlobal();
  if (!Proofreader) {
    return null;
  }

  const availability = await Proofreader.availability();
  if (availability === "unavailable") {
    return null;
  }

  const expectedInputLanguages = mapProofreaderLanguages(language);
  return Proofreader.create({ expectedInputLanguages });
}

async function getSession(language) {
  const langKey = mapProofreaderLanguages(language).join(",");
  if (sessionPromise && sessionLanguagesKey !== langKey) {
    await destroyProofreaderSession();
  }
  if (!sessionPromise) {
    sessionLanguagesKey = langKey;
    sessionPromise = createSession(language);
  }
  return sessionPromise;
}

/**
 * @returns {Promise<{ matches: object[], correctedInput?: string, source: 'proofreader' } | null>}
 */
export async function proofreadWithEdge(text, language = "ru-RU") {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) {
    return { matches: [], source: "proofreader" };
  }

  const Proofreader = getProofreaderGlobal();
  if (!Proofreader) {
    return null;
  }

  const availability = await getProofreaderAvailability();
  if (!isProofreaderUsable(availability)) {
    return null;
  }

  const session = await getSession(language);
  if (!session) {
    return null;
  }

  const result = await session.proofread(trimmed);
  const matches = mapProofreaderCorrections(result?.corrections);

  if (!matches.length && result?.correctedInput === trimmed) {
    return { matches: [], correctedInput: trimmed, source: "proofreader" };
  }

  return {
    matches,
    correctedInput: result?.correctedInput,
    source: "proofreader",
  };
}

export async function destroyProofreaderSession() {
  if (!sessionPromise) return;
  try {
    const session = await sessionPromise;
    session?.destroy?.();
  } catch {
    /* ignore */
  }
  sessionPromise = null;
  sessionLanguagesKey = "";
}
