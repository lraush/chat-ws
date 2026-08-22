const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/** @type {Map<string, { start: number, count: number }>} */
const attempts = new Map();

function loginRateLimit(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  const email = String(req.body?.email ?? "")
    .trim()
    .toLowerCase();
  const key = `${ip}:${email || "no-email"}`;
  const now = Date.now();

  let entry = attempts.get(key);
  if (!entry || now - entry.start > WINDOW_MS) {
    entry = { start: now, count: 0 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    res.status(429).json({ error: "rate_limit" });
    return;
  }

  entry.count += 1;
  attempts.set(key, entry);
  next();
}

/** @internal test helper */
function resetLoginRateLimits() {
  attempts.clear();
}

module.exports = {
  loginRateLimit,
  resetLoginRateLimits,
};
