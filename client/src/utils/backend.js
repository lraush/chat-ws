/** Backend URL (Express + Socket.IO on port 3030). */
export function getBackendUrl() {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/$/, "");
  }

  const scheme = window.location.protocol === "https:" ? "https" : "http";
  return `${scheme}://${window.location.hostname}:3030`;
}
