require("dotenv").config();

const { createServer } = require("./createServer");
const { validateEnv } = require("./config/env");
const { ensureSeedAdmin } = require("./services/auth.services");

validateEnv();

const PORT = Number(process.env.PORT) || 3030;
const { server } = createServer();

ensureSeedAdmin().catch((err) => {
  console.error("[auth] seed admin failed:", err);
});

server.listen(PORT, () => {
  console.log(`Server is running: ${PORT}`);
});
