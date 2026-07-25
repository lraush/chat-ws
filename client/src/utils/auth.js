const STORAGE_KEY = "chatUserName";

export function getUserName() {
  return sessionStorage.getItem(STORAGE_KEY)?.trim() ?? "";
}

export function setUserName(name) {
  sessionStorage.setItem(STORAGE_KEY, name.trim());
}

export function clearUserName() {
  sessionStorage.removeItem(STORAGE_KEY);
}
