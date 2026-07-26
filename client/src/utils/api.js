import { getBackendUrl, isBackendConfigured } from "./backend";
import { clearAuthSession, getAuthToken, setAuthSession } from "./auth";

function apiBase() {
  const base = getBackendUrl();
  if (!base) throw new Error("config");
  return base;
}

async function authFetch(path, options = {}) {
  if (!isBackendConfigured()) throw new Error("config");
  const headers = {
    ...(options.headers ?? {}),
  };
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let res;
  try {
    res = await fetch(`${apiBase()}${path}`, { ...options, headers });
  } catch {
    throw new Error("network");
  }

  if (res.status === 401) {
    clearAuthSession();
    throw new Error("unauthorized");
  }

  return res;
}

export async function login(email, password) {
  if (!isBackendConfigured()) throw new Error("config");
  let res;
  try {
    res = await fetch(`${apiBase()}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error("network");
  }
  if (res.status === 401) {
    throw new Error("invalid_credentials");
  }
  if (!res.ok) {
    throw new Error("login_failed");
  }
  const data = await res.json();
  setAuthSession({ token: data.token, user: data.user });
  return data;
}

export async function createRoom() {
  const res = await authFetch("/api/rooms", { method: "POST" });
  if (!res.ok) {
    throw new Error("failed to create room");
  }
  return res.json();
}

export async function fetchRoom(roomId) {
  let res;
  try {
    res = await authFetch(`/api/rooms/${encodeURIComponent(roomId)}`);
  } catch (err) {
    if (err?.message === "unauthorized") throw err;
    throw new Error("network");
  }
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error("failed to load room");
  }
  return res.json();
}

export async function saveRoomSecretNumber(roomId, secretNumber) {
  let res;
  try {
    res = await authFetch(
      `/api/rooms/${encodeURIComponent(roomId)}/secret-number`,
      {
        method: "PUT",
        body: JSON.stringify({ secretNumber }),
      },
    );
  } catch (err) {
    if (err?.message === "unauthorized") throw err;
    throw new Error("network");
  }
  if (res.status === 404) {
    throw new Error("room not found");
  }
  if (!res.ok) {
    throw new Error("failed to save secret number");
  }
  return res.json();
}

export async function adminCreateUser({ email, password, name }) {
  let res;
  try {
    res = await authFetch("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  } catch (err) {
    if (err?.message === "unauthorized") throw err;
    throw new Error("network");
  }
  if (res.status === 403) {
    throw new Error("forbidden");
  }
  if (res.status === 409) {
    throw new Error("email_taken");
  }
  if (!res.ok) {
    throw new Error("failed_to_create_user");
  }
  return res.json();
}
