const INSECURE_JWT_SECRETS = new Set([
  "",
  "change-me-in-production",
  "dev-insecure-change-me",
]);

const DEV_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

function parseCorsOrigins() {
  const raw =
    process.env.CORS_ORIGINS?.trim() || process.env.CLIENT_ORIGIN?.trim() || "";
  const fromEnv = raw
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);

  if (fromEnv.length) {
    return fromEnv;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Set CORS_ORIGINS or CLIENT_ORIGIN in production (comma-separated frontend URLs)",
    );
  }

  return DEV_ORIGINS;
}

function validateEnv() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is required");
  }

  const secret = process.env.JWT_SECRET?.trim() || "";
  if (
    process.env.NODE_ENV === "production" &&
    INSECURE_JWT_SECRETS.has(secret)
  ) {
    throw new Error(
      "JWT_SECRET must be a strong random string in production (not the example value)",
    );
  }

  parseCorsOrigins();
}

function getCorsOrigins() {
  return parseCorsOrigins();
}

module.exports = {
  validateEnv,
  getCorsOrigins,
};
