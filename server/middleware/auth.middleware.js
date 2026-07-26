const { findUserById } = require("../services/auth.services");
const { verifyAccessToken } = require("../services/auth.crypto");

function getBearerToken(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

async function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload?.sub) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const user = await findUserById(payload.sub);
  if (!user) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  next();
}

async function attachUserFromToken(token) {
  const payload = verifyAccessToken(token);
  if (!payload?.sub) return null;
  return findUserById(payload.sub);
}

module.exports = {
  getBearerToken,
  requireAuth,
  requireAdmin,
  attachUserFromToken,
};
