const express = require("express");
const {
  createRoom,
  getRoomById,
  setRoomSecretNumber,
} = require("./services/room.services");
const { requireAuth } = require("./middleware/auth.middleware");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Этот мир придуман не нами");
});

router.post("/api/rooms", requireAuth, async (req, res) => {
  try {
    const room = await createRoom();
    res.status(201).json({ id: room.id });
  } catch (err) {
    console.error("create room error:", err);
    res.status(500).json({ error: "failed to create room" });
  }
});

router.get("/api/rooms/:roomId", requireAuth, async (req, res) => {
  try {
    const roomId = decodeURIComponent(req.params.roomId).trim();
    const room = await getRoomById(roomId);
    if (!room) {
      res.status(404).json({ error: "room not found" });
      return;
    }
    res.json({ id: room.id });
  } catch (err) {
    console.error("get room error:", err);
    res.status(500).json({ error: "failed to load room" });
  }
});

router.put("/api/rooms/:roomId/secret-number", requireAuth, async (req, res) => {
  try {
    const roomId = decodeURIComponent(req.params.roomId).trim();
    if (req.body?.secretNumber === undefined || req.body?.secretNumber === null) {
      res.status(400).json({ error: "secretNumber is required" });
      return;
    }
    const room = await setRoomSecretNumber(roomId, req.body.secretNumber);
    if (!room) {
      res.status(404).json({ error: "room not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("set secret number error:", err);
    res.status(500).json({ error: "failed to save secret number" });
  }
});

module.exports = router;
