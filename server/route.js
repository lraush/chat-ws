const express = require("express");
const {
  createRoom,
  getRoomByIdentifier,
  canAccessRoom,
  publicRoom,
  setRoomSecretNumber,
} = require("./services/room.services");
const { requireAuth } = require("./middleware/auth.middleware");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Этот мир придуман не нами");
});

router.post("/api/rooms", requireAuth, async (req, res) => {
  try {
    const room = await createRoom({ createdById: req.user.id });
    res.status(201).json(publicRoom(room));
  } catch (err) {
    console.error("create room error:", err);
    res.status(500).json({ error: "failed to create room" });
  }
});

router.get("/api/rooms/:roomId", requireAuth, async (req, res) => {
  try {
    const roomKey = decodeURIComponent(req.params.roomId).trim();
    const room = await getRoomByIdentifier(roomKey);
    if (!room) {
      res.status(404).json({ error: "room not found" });
      return;
    }

    const allowed = await canAccessRoom(room, req.user.id);
    if (!allowed) {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    res.json(publicRoom(room));
  } catch (err) {
    console.error("get room error:", err);
    res.status(500).json({ error: "failed to load room" });
  }
});

router.put("/api/rooms/:roomId/secret-number", requireAuth, async (req, res) => {
  try {
    const roomKey = decodeURIComponent(req.params.roomId).trim();
    const room = await getRoomByIdentifier(roomKey);
    if (!room) {
      res.status(404).json({ error: "room not found" });
      return;
    }

    const allowed = await canAccessRoom(room, req.user.id);
    if (!allowed) {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    if (req.body?.secretNumber === undefined || req.body?.secretNumber === null) {
      res.status(400).json({ error: "secretNumber is required" });
      return;
    }
    const updated = await setRoomSecretNumber(room.id, req.body.secretNumber);
    if (!updated) {
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
