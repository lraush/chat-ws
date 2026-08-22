require("dotenv").config();

const express = require("express");
const cors = require("cors");
const route = require("./route");
const routeAuth = require("./route.auth");
const routeSpellcheck = require("./route.spellcheck");
const routeHealth = require("./route.health");
const routeFriends = require("./route.friends");
const routeAttachments = require("./route.attachments");
const { getCorsOrigins } = require("./config/env");

function createApp() {
  const app = express();
  const origins = getCorsOrigins();
  app.use(
    cors({
      origin: origins,
      credentials: true,
    }),
  );
  app.set("trust proxy", 1);
  app.use(express.json());
  app.use(routeHealth);
  app.use(routeAuth);
  app.use(routeSpellcheck);
  app.use(routeFriends);
  app.use(routeAttachments);
  app.use(route);
  return app;
}

module.exports = { createApp };
