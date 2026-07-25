const express = require("express");
const { createRoom, getRoomById } = require("./services/room.services");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Этот мир придуман не нами");
});

router.post("/api/rooms", async (req, res) => {
  try {
    const room = await createRoom();
    res.status(201).json({ id: room.id });
  } catch (err) {
    console.error("create room error:", err);
    res.status(500).json({ error: "failed to create room" });
  }
});

router.get("/api/rooms/:roomId", async (req, res) => {
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

module.exports = router;
