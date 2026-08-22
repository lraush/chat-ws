const http = require("http");
const { Server } = require("socket.io");
const { createApp } = require("./app");
const chatSocket = require("./sockets/chat.socket");
const { setIo } = require("./io");
const { attachUserFromToken } = require("./middleware/auth.middleware");
const { getCorsOrigins } = require("./config/env");

function createServer() {
  const app = createApp();
  const server = http.createServer(app);
  const origins = getCorsOrigins();

  const io = new Server(server, {
    cors: {
      origin: origins,
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      next(new Error("unauthorized"));
      return;
    }
    const user = await attachUserFromToken(token);
    if (!user) {
      next(new Error("unauthorized"));
      return;
    }
    socket.user = user;
    next();
  });

  io.on("connection", (socket) => {
    chatSocket(io, socket);
  });

  setIo(io);

  return { app, server, io };
}

module.exports = { createServer };
