const { log_guild_id, log_channel_id } = require("./environment.js").discord;

const LEVELS = { error: 0, warn: 1, info: 2, discord: 3, debug: 4 };

var client;
var currentLevel = "info";

function init(discord, level) {
  client = discord;
  setLevel(level);
}

function log(message, level = "info") {
  if (LEVELS[level] > LEVELS[currentLevel]) {
    return;
  }

  const timestamp = new Date().toLocaleString();
  const log_message = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  switch (level) {
    case "error":
      console.error(log_message, message.stack);
      break;
    case "discord":
      sendToDiscord(log_message);
    case "warn":
    case "info":
    case "debug":
      console.log(log_message);
      break;
    default:
      console.log(`[${timestamp}] [UNKNOWN] ${message}`);
  }
}

function error(message) {
  log(message, "error");
}

function warn(message) {
  log(message, "warn");
}

function info(message) {
  log(message, "info");
}

function discord(message) {
  log(message, "discord");
}

function debug(message) {
  log(message, "debug");
}

function setLevel(newLevel) {
  if (newLevel in LEVELS) {
    currentLevel = newLevel;
  }
}

async function sendToDiscord(message) {
  client.guilds.cache
    .get(log_guild_id)
    .channels.cache.get(log_channel_id)
    .send(message)
    .catch((err) => error(err));
}

module.exports = {
  init: init,
  error: error,
  warn: warn,
  info: info,
  discord: discord,
  debug: debug,
};
