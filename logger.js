/**
 * @file Logger module
 * @description Provides logging functionality with multiple levels and Discord integration
 */

const { app: appEnv, discord: disEnv } = require("./environment.js");

/**
 * Log levels mapping
 * @type {Object.<string, number>}
 */
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

var client;
var currentLevel = "info";

/**
 * Determines the default log level based on environment
 * @returns {string} Default log level
 */
function getDefaultLogLevel() {
  if (appEnv.logLevel && appEnv.logLevel in LEVELS) {
    return appEnv.logLevel;
  }

  if (appEnv.nodeEnv === "production") {
    return "info";
  }

  return "debug";
}

/**
 * Initializes the logger with Discord client and log level
 * @param {import('discord.js').Client} discord - Discord client instance
 * @param {string} [level] - Log level to set (optional, uses environment if not provided)
 */
function init(discord, level) {
  client = discord;

  const logLevel = level || getDefaultLogLevel();
  setLevel(logLevel);

  info(`Logger initialized with level: ${currentLevel.toUpperCase()}`);
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
 * Logs debug message
 * @param {string} message - Debug message to log
 */
function debug(message) {
  log(message, "debug");
}

/**
 * Logs message to Discord and console
 * @param {string} message - Message to log
 * @return {Promise<void>}
 */
async function discord(message) {
  await sendToDiscord(message);
}

/**
 * Sets the current log level
 * @param {string} newLevel - New log level to set
 */
function setLevel(newLevel) {
  if (newLevel in LEVELS) {
    currentLevel = newLevel;
    console.log(`[LOGGER] Log level set to: ${newLevel.toUpperCase()}`);
  } else {
    console.warn(
      `[LOGGER] Invalid log level: ${newLevel}. Using default: ${currentLevel.toUpperCase()}`,
    );
  }
}

/**
 * Sends log message to Discord channel
 * @param {string} message - Message to send to Discord
 */
async function sendToDiscord(message) {
  await client.guilds.cache
    .get(disEnv.log_guild_id)
    .channels.cache.get(disEnv.log_channel_id)
    .send(message)
    .catch((err) => error(err));
}

module.exports = {
  init: init,
  error: error,
  warn: warn,
  info: info,
  debug: debug,
  discord: discord,
};
