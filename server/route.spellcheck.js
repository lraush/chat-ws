const express = require("express");
const { requireAuth } = require("./middleware/auth.middleware");
const { checkTextWithLanguageTool } = require("./services/languagetool.service");
const { parseSpellcheckRequest } = require("./utils/spellcheckRequest");

const router = express.Router();

router.post("/api/spellcheck", requireAuth, async (req, res) => {
  try {
    const parsed = parseSpellcheckRequest(req.body);
    if (!parsed.ok) {
      res.status(parsed.status).json({ error: parsed.error });
      return;
    }

    const { text, language } = parsed;

    const result = await checkTextWithLanguageTool(text, language);
    if (result.error === "text_too_long") {
      res.status(400).json({ error: "text_too_long" });
      return;
    }
    if (result.error === "rate_limit") {
      res.status(429).json({ error: "rate_limit" });
      return;
    }
    if (result.error) {
      res.status(502).json({ error: result.error });
      return;
    }

    res.json({ matches: result.matches, language: result.language });
  } catch (err) {
    console.error("spellcheck error:", err);
    res.status(500).json({ error: "spellcheck failed" });
  }
});

module.exports = router;
