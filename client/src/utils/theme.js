export const THEME_STORAGE_KEY = "chatTheme";
export const ORNAMENT_STORAGE_KEY = "chatOrnament";

export const DEFAULT_THEME = "lavender";
export const DEFAULT_ORNAMENT = "none";

export const THEMES = [
  { id: "lavender", label: "Лаванда", swatch: "#ddd6eb" },
  { id: "rose", label: "Роза", swatch: "#f0dde3" },
  { id: "mint", label: "Мята", swatch: "#dcebe3" },
  { id: "sand", label: "Песок", swatch: "#ebe3d6" },
  { id: "sky", label: "Небо", swatch: "#dce8f2" },
  { id: "vivid", label: "Яркая", swatch: "#6325a9" },
];

export const ORNAMENTS = [
  { id: "none", label: "Нет" },
  { id: "dots", label: "Точки" },
  { id: "grid", label: "Сетка" },
  { id: "waves", label: "Волны" },
  { id: "diamond", label: "Ромбы" },
  { id: "lace", label: "Кружево" },
  { id: "petals", label: "Лепестки" },
];

const themeIds = new Set(THEMES.map((theme) => theme.id));
const ornamentIds = new Set(ORNAMENTS.map((ornament) => ornament.id));

export function isValidThemeId(id) {
  return themeIds.has(id);
}

export function isValidOrnamentId(id) {
  return ornamentIds.has(id);
}

export function getStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && isValidThemeId(stored)) {
      return stored;
    }
  } catch {
    // ignore
  }
  return DEFAULT_THEME;
}

export function getStoredOrnament() {
  try {
    const stored = localStorage.getItem(ORNAMENT_STORAGE_KEY);
    if (stored && isValidOrnamentId(stored)) {
      return stored;
    }
  } catch {
    // ignore
  }
  return DEFAULT_ORNAMENT;
}

export function applyTheme(themeId) {
  const id = isValidThemeId(themeId) ? themeId : DEFAULT_THEME;
  document.documentElement.setAttribute("data-theme", id);
  return id;
}

export function applyOrnament(ornamentId) {
  const id = isValidOrnamentId(ornamentId) ? ornamentId : DEFAULT_ORNAMENT;
  document.documentElement.setAttribute("data-ornament", id);
  return id;
}

export function setTheme(themeId) {
  const id = applyTheme(themeId);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    // ignore
  }
  return id;
}

export function setOrnament(ornamentId) {
  const id = applyOrnament(ornamentId);
  try {
    localStorage.setItem(ORNAMENT_STORAGE_KEY, id);
  } catch {
    // ignore
  }
  return id;
}

export function initTheme() {
  applyOrnament(getStoredOrnament());
  return applyTheme(getStoredTheme());
}

export function getThemeById(themeId) {
  return THEMES.find((theme) => theme.id === themeId) ?? THEMES[0];
}
