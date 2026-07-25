require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const route = require("./route");
const chatSocket = require("./sockets/chat.socket");

const app = express();
const PORT = 3030;

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(route);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  chatSocket(io, socket);
});

server.listen(PORT, () => {
  console.log(`Server is running: ${PORT}`);
});
