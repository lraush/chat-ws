const express = require("express");
const prisma = require("./db/prisma");

const router = express.Router();

router.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "up" });
  } catch (err) {
    console.error("health check failed:", err);
    res.status(503).json({ ok: false, db: "down" });
  }
});

module.exports = router;
