import { normalizeRotations } from "./cipher";
import { normalizeRoomId } from "./room";

const STORAGE_PREFIX = "chatRoomCipher:";

function storageKey(roomId) {
  return `${STORAGE_PREFIX}${normalizeRoomId(roomId)}`;
}

/** @returns {number | null} null if user has not set cipher for this room yet */
export function getRoomCipherRotations(roomId) {
  const id = normalizeRoomId(roomId);
  if (!id) return null;

  const raw = sessionStorage.getItem(storageKey(id));
  if (raw === null || raw === "") return null;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function setRoomCipherRotations(roomId, rotations) {
  const id = normalizeRoomId(roomId);
  if (!id) return;
  sessionStorage.setItem(storageKey(id), String(normalizeRotations(rotations)));
}

export function clearRoomCipherRotations(roomId) {
  const id = normalizeRoomId(roomId);
  if (!id) return;
  sessionStorage.removeItem(storageKey(id));
}

export function hasRoomCipherConfigured(roomId) {
  return getRoomCipherRotations(roomId) !== null;
}
