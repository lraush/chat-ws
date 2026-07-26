const prisma = require("../db/prisma");
const {
  hashPassword,
  normalizeEmail,
  publicUser,
  verifyPassword,
} = require("./auth.crypto");

async function findUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });
}

async function findUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

async function loginWithEmailPassword(email, password) {
  const user = await findUserByEmail(email);
  if (!user) {
    return { error: "invalid_credentials" };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { error: "invalid_credentials" };
  }

  return { user };
}

async function createUser({ email, password, name, isAdmin = false }) {
  const normalized = normalizeEmail(email);
  if (!normalized || !password) {
    throw new Error("email and password required");
  }

  const displayName = String(name ?? "").trim() || normalized.split("@")[0];

  const existing = await prisma.user.findUnique({
    where: { email: normalized },
  });
  if (existing) {
    return { error: "email_taken" };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: normalized,
      passwordHash,
      name: displayName,
      isAdmin: Boolean(isAdmin),
    },
  });

  return { user };
}

async function ensureSeedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) return;

  const normalized = normalizeEmail(email);
  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) return;

  await createUser({
    email: normalized,
    password,
    name: "Admin",
    isAdmin: true,
  });
  console.log(`[auth] Seed admin created: ${normalized}`);
}

module.exports = {
  findUserByEmail,
  findUserById,
  loginWithEmailPassword,
  createUser,
  ensureSeedAdmin,
  publicUser,
};
