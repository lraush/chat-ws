const { createMessage, getMessages } = require("../services/message.services");
const {
  getRoomByIdentifier,
  canAccessRoom,
} = require("../services/room.services");

function chatSocket(io, socket) {
  console.log("user connected: ", socket.id, socket.user?.email);

  socket.on("join", async ({ room }, ack) => {
    try {
      const user = socket.user;
      if (!user?.id) {
        ack?.({ error: "unauthorized" });
        return;
      }

      if (!room?.trim()) {
        ack?.({ error: "room is required" });
        return;
      }

      const roomKey = room.trim();
      const roomRecord = await getRoomByIdentifier(roomKey);

      if (!roomRecord) {
        ack?.({ error: "room not found" });
        return;
      }

      const allowed = await canAccessRoom(roomRecord, user.id);
      if (!allowed) {
        ack?.({ error: "forbidden" });
        return;
      }

      for (const joinedRoom of socket.rooms) {
        if (joinedRoom !== socket.id) {
          socket.leave(joinedRoom);
        }
      }

      socket.room = roomRecord.id;
      socket.join(socket.room);

      const messages = await getMessages(socket.room);
      ack?.({ user: { id: user.id, name: user.name, email: user.email }, messages });
    } catch (err) {
      console.error("join error:", err);
      ack?.({ error: "failed to join room" });
    }
  });

  socket.on("getMessage", async (cb) => {
    try {
      if (!socket.room) {
        cb?.([]);
        return;
      }
      const messages = await getMessages(socket.room);
      cb?.(messages);
    } catch (err) {
      console.error("getMessage error:", err);
      cb?.([]);
    }
  });

  socket.on("sendMessage", async (data, ack) => {
    try {
      const user = socket.user;
      if (!user?.id || !socket.room) {
        ack?.({ error: "join a room first" });
        return;
      }

      const content = data?.content?.trim();
      if (!content) {
        ack?.({ error: "message is empty" });
        return;
      }

      const message = await createMessage({
        content,
        userId: user.id,
        room: socket.room,
      });

      io.to(socket.room).emit("message:new", message);
      ack?.({ message });
    } catch (err) {
      console.error("sendMessage error:", err);
      ack?.({ error: "failed to send message" });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: ", socket.id);
  });
}

module.exports = chatSocket;
