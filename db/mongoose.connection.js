const mongoose = require("mongoose");

const { db: env } = require("../environment.js");
const logger = require("../logger.js");

const URI =
  `mongodb://${env.user}:${env.pwd}` +
  `@${env.cluster_url}:${env.port}` +
  `/${env.auth_source}` +
  `?authMechanism=${env.auth_mechanism}` +
  `&authSource=${env.auth_source}`;

const RETRY_DELAY = 5000;

/**
 * Initializes database connection with retry logic
 */
async function init() {
  mongoose.connection.on("error", (error) => {
    logger.error(`MongoDB connection error: ${error.message}`);
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB reconnected");
  });

  while (true) {
    try {
      logger.info("Trying to connect to MongoDB...");

      await mongoose.connect(URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });

      logger.info("Successfully connected to MongoDB");
      break;
    } catch (error) {
      logger.warn(
        `MongoDB not ready (${error.message}). Retry in ${RETRY_DELAY / 1000}s`,
      );
      await sleep(RETRY_DELAY);
    }
  }
}

/**
 * Sleeps for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  init,
};
