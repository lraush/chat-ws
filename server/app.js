require("dotenv").config();

const express = require("express");
const cors = require("cors");
const route = require("./route");
const routeAuth = require("./route.auth");
const routeSpellcheck = require("./route.spellcheck");

function createApp() {
  const app = express();
  app.use(cors({ origin: "*" }));
  app.use(express.json());
  app.use(routeAuth);
  app.use(routeSpellcheck);
  app.use(route);
  return app;
}

module.exports = { createApp };
