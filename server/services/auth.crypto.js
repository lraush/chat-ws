const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-insecure-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function normalizeEmail(email) {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

async function hashPassword(plain) {
  return bcrypt.hash(String(plain), 12);
}

async function verifyPassword(plain, passwordHash) {
  return bcrypt.compare(String(plain), passwordHash);
}

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      isAdmin: Boolean(user.isAdmin),
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: Boolean(user.isAdmin),
  };
}

module.exports = {
  normalizeEmail,
  hashPassword,
  verifyPassword,
  signAccessToken,
  verifyAccessToken,
  publicUser,
};
