const express = require("express");
const { signAccessToken, publicUser } = require("./services/auth.crypto");
const {
  createUser,
  loginWithEmailPassword,
} = require("./services/auth.services");
const { requireAuth, requireAdmin } = require("./middleware/auth.middleware");

const router = express.Router();

router.post("/api/auth/login", async (req, res) => {
  try {
    const email = req.body?.email;
    const password = req.body?.password;
    if (!email || !password) {
      res.status(400).json({ error: "email and password required" });
      return;
    }

    const result = await loginWithEmailPassword(email, password);
    if (result.error) {
      res.status(401).json({ error: "invalid_credentials" });
      return;
    }

    const token = signAccessToken(result.user);
    res.json({ token, user: publicUser(result.user) });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ error: "login failed" });
  }
});

router.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.post(
  "/api/admin/users",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { email, password, name } = req.body ?? {};
      if (!email || !password) {
        res.status(400).json({ error: "email and password required" });
        return;
      }

      const result = await createUser({ email, password, name, isAdmin: false });
      if (result.error === "email_taken") {
        res.status(409).json({ error: "email_taken" });
        return;
      }

      res.status(201).json({ user: publicUser(result.user) });
    } catch (err) {
      console.error("admin create user error:", err);
      res.status(500).json({ error: "failed to create user" });
    }
  },
);

module.exports = router;
