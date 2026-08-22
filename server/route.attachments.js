const express = require("express");
const { randomUUID } = require("node:crypto");
const path = require("node:path");
const {
  validateUploadFile,
  writeUploadedFile,
  readUploadedFile,
} = require("./services/attachment.service");
const {
  createAttachmentMessage,
  getMessageRecordById,
} = require("./services/message.services");
const {
  getRoomByIdentifier,
  canAccessRoom,
} = require("./services/room.services");
const { requireAuth } = require("./middleware/auth.middleware");
const { uploadSingleAttachment } = require("./middleware/upload.middleware");
const { getIo } = require("./io");

const router = express.Router();

router.post(
  "/api/rooms/:roomId/attachments",
  requireAuth,
  uploadSingleAttachment,
  async (req, res) => {
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

      const validation = validateUploadFile(req.file);
      if (validation.error) {
        const status =
          validation.error === "file_too_large"
            ? 413
            : validation.error === "file_required"
              ? 400
              : 415;
        res.status(status).json({ error: validation.error });
        return;
      }

      const ext = path.extname(validation.safeName).toLowerCase();
      const storedName = `${randomUUID()}${ext}`;
      writeUploadedFile(storedName, req.file.buffer);

      const message = await createAttachmentMessage({
        content: "",
        kind: validation.kind,
        fileName: validation.safeName,
        storedName,
        mimeType: validation.mimeType,
        fileSize: validation.fileSize,
        userId: req.user.id,
        room: room.id,
      });

      const io = getIo();
      io?.to(room.id).emit("message:new", message);

      res.status(201).json({ message });
    } catch (err) {
      console.error("upload attachment error:", err);
      res.status(500).json({ error: "failed to upload file" });
    }
  },
);

router.get("/api/attachments/:messageId", requireAuth, async (req, res) => {
  try {
    const message = await getMessageRecordById(req.params.messageId);
    if (!message || !message.storedName) {
      res.status(404).json({ error: "not found" });
      return;
    }

    const room = await getRoomByIdentifier(message.room);
    if (!room) {
      res.status(404).json({ error: "not found" });
      return;
    }

    const allowed = await canAccessRoom(room, req.user.id);
    if (!allowed) {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    const buffer = readUploadedFile(message.storedName);
    if (!buffer) {
      res.status(404).json({ error: "file_missing" });
      return;
    }

    res.setHeader("Content-Type", message.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(message.fileName || "file")}"`,
    );
    res.send(buffer);
  } catch (err) {
    console.error("download attachment error:", err);
    res.status(500).json({ error: "failed to load file" });
  }
});

module.exports = router;
