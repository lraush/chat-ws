export function normalizeRoomId(roomId) {
  if (!roomId) return "";
  try {
    return decodeURIComponent(String(roomId)).trim();
  } catch {
    return String(roomId).trim();
  }
}

export function buildInviteUrl(roomId) {
  const id = normalizeRoomId(roomId);
  if (!id) return "";
  return `${window.location.origin}/join/${id}`;
}

/** Room id from full invite URL or raw id string */
export function parseRoomIdFromInvite(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return "";

  try {
    if (raw.includes("://") || raw.startsWith("/join/")) {
      const url = raw.includes("://")
        ? new URL(raw)
        : new URL(raw, window.location.origin);
      const parts = url.pathname.split("/").filter(Boolean);
      const joinIndex = parts.indexOf("join");
      if (joinIndex !== -1 && parts[joinIndex + 1]) {
        return normalizeRoomId(parts[joinIndex + 1]);
      }
    }
  } catch {
    // fall through to plain id
  }

  return normalizeRoomId(raw);
}
