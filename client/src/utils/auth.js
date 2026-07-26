const TOKEN_KEY = "chatAuthToken";
const USER_KEY = "chatAuthUser";

export function getAuthToken() {
  return sessionStorage.getItem(TOKEN_KEY)?.trim() ?? "";
}

export function getAuthUser() {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getAuthToken() && getAuthUser()?.id);
}

export function isAdmin() {
  return Boolean(getAuthUser()?.isAdmin);
}

export function getUserName() {
  return getAuthUser()?.name?.trim() ?? "";
}

export function setAuthSession({ token, user }) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function updateAuthUser(partial) {
  const current = getAuthUser();
  if (!current) return;
  sessionStorage.setItem(USER_KEY, JSON.stringify({ ...current, ...partial }));
}

export function clearAuthSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

/** @deprecated use clearAuthSession */
export function clearUserName() {
  clearAuthSession();
}

/** @deprecated no-op for legacy imports */
export function setUserName() {}
