const prisma = require("../db/prisma");
const {
  validateDisplayName,
} = require("../utils/displayName");
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

async function findUserByName(name, excludeUserId) {
  return prisma.user.findFirst({
    where: {
      name,
      ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
    },
  });
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

  const parsed = validateDisplayName(name ?? normalized.split("@")[0]);
  if (parsed.error) {
    return { error: "invalid_name" };
  }
  const displayName = parsed.name;

  const existing = await prisma.user.findUnique({
    where: { email: normalized },
  });
  if (existing) {
    return { error: "email_taken" };
  }

  const nameTaken = await findUserByName(displayName);
  if (nameTaken) {
    return { error: "name_taken" };
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

async function updateUserName(userId, name) {
  const parsed = validateDisplayName(name);
  if (parsed.error) {
    return { error: parsed.error };
  }
  const displayName = parsed.name;

  const nameTaken = await findUserByName(displayName, userId);
  if (nameTaken) {
    return { error: "name_taken" };
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: displayName },
    });
    return { user };
  } catch (err) {
    if (err?.code === "P2002") {
      return { error: "name_taken" };
    }
    throw err;
  }
}

async function changeUserPassword(userId, currentPassword, newPassword) {
  const user = await findUserById(userId);
  if (!user) {
    return { error: "not_found" };
  }

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) {
    return { error: "invalid_current_password" };
  }

  const next = String(newPassword ?? "");
  if (next.length < 6) {
    return { error: "weak_password" };
  }

  const passwordHash = await hashPassword(next);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
  return { ok: true };
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
  updateUserName,
  changeUserPassword,
  ensureSeedAdmin,
  publicUser,
};
