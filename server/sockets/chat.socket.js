const { createMessage, getMessages } = require("../services/message.services");
const prisma = require("../db/prisma");

function chatSocket(io, socket) {
  console.log("user connected: ", socket.id);

  socket.on("join", async ({ name, room }, ack) => {
    try {
      if (!name?.trim() || !room?.trim()) {
        ack?.({ error: "name and room are required" });
        return;
      }

      const roomId = room.trim();
      const roomRecord = await prisma.room.findUnique({
        where: { id: roomId },
      });

      if (!roomRecord) {
        ack?.({ error: "room not found" });
        return;
      }

      let user = await prisma.user.findUnique({
        where: { name: name.trim() },
      });

      if (!user) {
        user = await prisma.user.create({
          data: { name: name.trim() },
        });
      }

      for (const joinedRoom of socket.rooms) {
        if (joinedRoom !== socket.id) {
          socket.leave(joinedRoom);
        }
      }

      socket.user = user;
      socket.room = roomId;
      socket.join(socket.room);

      const messages = await getMessages(socket.room);
      ack?.({ user, messages });
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
      if (!socket.user || !socket.room) {
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
        userId: socket.user.id,
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
