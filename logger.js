/**
 * @file Logger module
 * @description Provides logging functionality with pino and Discord integration
 */

const pino = require("pino");
const fs = require("fs");
const path = require("path");
const { app: appEnv, discord: disEnv } = require("./environment.js");

/**
 * Supported logger levels
 * @type {Set<string>}
 */
const LEVELS = new Set(["fatal", "error", "warn", "info", "debug", "trace"]);
const APP_NAME = "yui";
const LOG_DIR = path.join(process.cwd(), "logs");

function formatDateStamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLogFilePath(date = new Date()) {
  return path.join(LOG_DIR, `${APP_NAME}-${formatDateStamp(date)}.log`);
}

class DailyFileDestination {
  constructor() {
    this.currentStamp = null;
    this.stream = null;
  }

  openIfNeeded() {
    const todayStamp = formatDateStamp(new Date());
    if (todayStamp === this.currentStamp && this.stream) {
      return;
    }

    if (this.stream && typeof this.stream.end === "function") {
      this.stream.end();
    }

    this.currentStamp = todayStamp;
    fs.mkdirSync(LOG_DIR, { recursive: true });
    this.stream = fs.createWriteStream(getLogFilePath(), { flags: "a" });
  }

  write(chunk) {
    this.openIfNeeded();
    return this.stream.write(chunk);
  }

  shutdown() {
    if (!this.stream) {
      return;
    }

    this.stream.end();
    this.stream = null;
    this.currentStamp = null;
  }
}

let client = null;
const fileDestination = new DailyFileDestination();
const coreLogger = pino(
  {
    level: getDefaultLogLevel(),
    base: {
      app: APP_NAME,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        "token",
        "pwd",
        "password",
        "authorization",
        "headers.authorization",
        "discord.token",
        "db.pwd",
      ],
      censor: "[Redacted]",
    },
  },
  pino.multistream([
    { level: "trace", stream: process.stdout },
    { level: "trace", stream: fileDestination },
  ]),
);

/**
 * Determines the default log level based on environment
 * @returns {string} Default log level
 */
function getDefaultLogLevel() {
  if (appEnv.logLevel && LEVELS.has(appEnv.logLevel)) {
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
  client = discord || null;

  const logLevel = level || getDefaultLogLevel();
  setLevel(logLevel);

  info(`Logger initialized with level: ${coreLogger.level.toUpperCase()}`);
}

/**
 * Main logging function
 * @param {string|Error|Object} message - Message to log
 * @param {string} [level="info"] - Log level
 */
function log(message, level = "info") {
  logWith(coreLogger, level, message);
}

/**
 * Logs error message.
 * @param {string|Error|Object} message - Error message to log
 */
function error(...args) {
  logWith(coreLogger, "error", ...args);
}

/**
 * Logs warning message.
 * @param {string|Error|Object} message - Warning message to log
 */
function warn(...args) {
  logWith(coreLogger, "warn", ...args);
}

/**
 * Logs info message.
 * @param {string|Error|Object} message - Info message to log
 */
function info(...args) {
  logWith(coreLogger, "info", ...args);
}

/**
 * Logs debug message.
 * @param {string|Error|Object} message - Debug message to log
 */
function debug(...args) {
  logWith(coreLogger, "debug", ...args);
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
  if (LEVELS.has(newLevel)) {
    coreLogger.level = newLevel;
    coreLogger.info({ level: newLevel }, "Log level set");
  } else {
    coreLogger.warn(
      { invalidLevel: newLevel, currentLevel: coreLogger.level },
      "Invalid log level, keeping previous",
    );
  }
}

/**
 * Flushes and closes logger destinations.
 */
function shutdown() {
  fileDestination.shutdown();
}

function createScopedLogger(bindings = {}) {
  const scoped = coreLogger.child(bindings);

  return {
    fatal(...args) {
      logWith(scoped, "fatal", ...args);
    },
    error(...args) {
      logWith(scoped, "error", ...args);
    },
    warn(...args) {
      logWith(scoped, "warn", ...args);
    },
    info(...args) {
      logWith(scoped, "info", ...args);
    },
    debug(...args) {
      logWith(scoped, "debug", ...args);
    },
    trace(...args) {
      logWith(scoped, "trace", ...args);
    },
    discord: discord,
    init: init,
    setLevel: setLevel,
    shutdown: shutdown,
    child(extraBindings = {}) {
      return createScopedLogger({ ...bindings, ...extraBindings });
    },
  };
}

function logWith(targetLogger, level, ...args) {
  const methodName = typeof targetLogger[level] === "function" ? level : "info";
  const [firstArg, secondArg] = args;
  const hasSecondArg = typeof secondArg !== "undefined";

  if (firstArg instanceof Error) {
    const msg = hasSecondArg ? String(secondArg) : firstArg.message;
    targetLogger[methodName]({ err: firstArg }, msg);
    return;
  }

  if (typeof firstArg === "object" && firstArg !== null) {
    if (hasSecondArg) {
      targetLogger[methodName](firstArg, String(secondArg));
      return;
    }

    targetLogger[methodName](firstArg);
    return;
  }

  if (hasSecondArg) {
    targetLogger[methodName](String(firstArg), secondArg);
    return;
  }

  targetLogger[methodName](String(firstArg));
}

/**
 * Sends log message to Discord channel
 * @param {string} message - Message to send to Discord
 */
async function sendToDiscord(message) {
  if (!client) {
    warn("Discord client is not initialized, skipping Discord log message");
    return;
  }

  const guild = client.guilds.cache.get(disEnv.log_guild_id);
  if (!guild) {
    warn(`Discord log guild not found: ${disEnv.log_guild_id}`);
    return;
  }

  const channel = guild.channels.cache.get(disEnv.log_channel_id);
  if (!channel) {
    warn(`Discord log channel not found: ${disEnv.log_channel_id}`);
    return;
  }

  await channel.send(message).catch((err) => error(err));
}
module.exports = {
  init: init,
  error: error,
  warn: warn,
  info: info,
  debug: debug,
  discord: discord,
  setLevel: setLevel,
  shutdown: shutdown,
  child: (bindings = {}) => createScopedLogger(bindings),
};
