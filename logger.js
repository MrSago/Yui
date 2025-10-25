/**
 * @file Logger module
 * @description Provides logging functionality with multiple levels and Discord integration
 */

const { log_guild_id, log_channel_id } = require("./environment.js").discord;

/**
 * Log levels mapping
 * @type {Object.<string, number>}
 */
const LEVELS = { error: 0, warn: 1, info: 2, discord: 3, debug: 4 };

var client;
var currentLevel = "info";

/**
 * Initializes the logger with Discord client and log level
 * @param {import('discord.js').Client} discord - Discord client instance
 * @param {string} level - Log level to set
 */
function init(discord, level) {
  client = discord;
  setLevel(level);
}

/**
 * Main logging function
 * @param {string} message - Message to log
 * @param {string} [level="info"] - Log level
 */
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

/**
 * Logs error message
 * @param {string} message - Error message to log
 */
function error(message) {
  log(message, "error");
}

/**
 * Logs warning message
 * @param {string} message - Warning message to log
 */
function warn(message) {
  log(message, "warn");
}

/**
 * Logs info message
 * @param {string} message - Info message to log
 */
function info(message) {
  log(message, "info");
}

/**
 * Logs message to Discord and console
 * @param {string} message - Message to log
 */
function discord(message) {
  log(message, "discord");
}

/**
 * Logs debug message
 * @param {string} message - Debug message to log
 */
function debug(message) {
  log(message, "debug");
}

/**
 * Sets the current log level
 * @param {string} newLevel - New log level to set
 */
function setLevel(newLevel) {
  if (newLevel in LEVELS) {
    currentLevel = newLevel;
  }
}

/**
 * Sends log message to Discord channel
 * @param {string} message - Message to send to Discord
 */
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
