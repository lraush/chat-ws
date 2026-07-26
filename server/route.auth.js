const express = require("express");
const { signAccessToken, publicUser } = require("./services/auth.crypto");
const {
  createUser,
  loginWithEmailPassword,
  updateUserName,
  changeUserPassword,
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

router.patch("/api/auth/profile", requireAuth, async (req, res) => {
  try {
    const name = req.body?.name;
    const result = await updateUserName(req.user.id, name);
    if (result.error === "invalid_name") {
      res.status(400).json({ error: "invalid_name" });
      return;
    }
    if (result.error === "name_taken") {
      res.status(409).json({ error: "name_taken" });
      return;
    }
    res.json({ user: publicUser(result.user) });
  } catch (err) {
    console.error("update profile error:", err);
    res.status(500).json({ error: "update failed" });
  }
});

router.patch("/api/auth/password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body ?? {};
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "passwords required" });
      return;
    }

    const result = await changeUserPassword(
      req.user.id,
      currentPassword,
      newPassword,
    );
    if (result.error === "invalid_current_password") {
      res.status(400).json({ error: "invalid_current_password" });
      return;
    }
    if (result.error === "weak_password") {
      res.status(400).json({ error: "weak_password" });
      return;
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("change password error:", err);
    res.status(500).json({ error: "update failed" });
  }
});

router.post(
  "/api/admin/users",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { email, password, name, isAdmin } = req.body ?? {};
      if (!email || !password) {
        res.status(400).json({ error: "email and password required" });
        return;
      }

      const result = await createUser({
        email,
        password,
        name,
        isAdmin: Boolean(isAdmin),
      });
      if (result.error === "email_taken") {
        res.status(409).json({ error: "email_taken" });
        return;
      }
      if (result.error === "name_taken") {
        res.status(409).json({ error: "name_taken" });
        return;
      }
      if (result.error === "invalid_name") {
        res.status(400).json({ error: "invalid_name" });
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
