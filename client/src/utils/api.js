import { getBackendUrl } from "./backend";

export async function createRoom() {
  let res;
  try {
    res = await fetch(`${getBackendUrl()}/api/rooms`, { method: "POST" });
  } catch {
    throw new Error("network");
  }
  if (!res.ok) {
    throw new Error("failed to create room");
  }
  return res.json();
}

export async function fetchRoom(roomId) {
  let res;
  try {
    res = await fetch(
      `${getBackendUrl()}/api/rooms/${encodeURIComponent(roomId)}`,
    );
  } catch {
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
