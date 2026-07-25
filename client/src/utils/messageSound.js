let audioContext = null;

const STORAGE_KEY = "chatMessageSoundEnabled";

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioContext) {
    audioContext = new Ctx();
  }
  return audioContext;
}

/** Call once after a user gesture so later sounds are allowed. */
export function primeMessageSound() {
  const ctx = getAudioContext();
  if (ctx?.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

export function isMessageSoundEnabled() {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored === null) return true;
  return stored === "1";
}

export function setMessageSoundEnabled(enabled) {
  sessionStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
}

export function playIncomingMessageSound() {
  if (!isMessageSoundEnabled()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const startTone = () => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(740, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.12);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  };

  if (ctx.state === "suspended") {
    ctx.resume().then(startTone).catch(() => {});
    return;
  }

  startTone();
}
