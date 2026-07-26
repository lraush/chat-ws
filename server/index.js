require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const route = require("./route");
const routeAuth = require("./route.auth");
const chatSocket = require("./sockets/chat.socket");
const { attachUserFromToken } = require("./middleware/auth.middleware");
const { ensureSeedAdmin } = require("./services/auth.services");

const app = express();
const PORT = Number(process.env.PORT) || 3030;

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(routeAuth);
app.use(route);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
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

ensureSeedAdmin().catch((err) => {
  console.error("[auth] seed admin failed:", err);
});

server.listen(PORT, () => {
  console.log(`Server is running: ${PORT}`);
});
