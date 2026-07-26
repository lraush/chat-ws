import { lazy } from "react";

const CHUNK_RELOAD_KEY = "chatChunkReload";

function isChunkLoadError(error) {
  const name = error?.name ?? "";
  const message = String(error?.message ?? "");
  return (
    name === "ChunkLoadError" ||
    message.includes("Loading chunk") ||
    message.includes("ChunkLoadError")
  );
}

/**
 * Lazy import that recovers when dev HMR or a deploy leaves a stale main bundle.
 */
export function lazyWithRetry(importFactory) {
  return lazy(() =>
    importFactory().catch((error) => {
      if (!isChunkLoadError(error)) {
        throw error;
      }

      const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY);
      if (!alreadyReloaded) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
        window.location.reload();
        return new Promise(() => {});
      }

      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      throw error;
    })
  );
}
