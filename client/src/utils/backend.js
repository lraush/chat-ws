const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** Backend URL (Express + Socket.IO). */
export function getBackendUrl() {
  const fromEnv = process.env.REACT_APP_API_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (typeof window === "undefined") return null;

  const { hostname, protocol } = window.location;
  if (!LOCAL_HOSTS.has(hostname)) return null;

  const scheme = protocol === "https:" ? "https" : "http";
  return `${scheme}://${hostname}:3030`;
}

export function isBackendConfigured() {
  return Boolean(getBackendUrl());
}

/** User-facing hint when API env is missing on a deployed frontend. */
export function getBackendConfigMessage() {
  return "Server URL is not set. In Vercel (or your host), add REACT_APP_API_URL to your public HTTPS API URL, then redeploy the frontend.";
}
