const config = require("../environment.js").db;
const logger = require("../logger.js");
const mongoose = require("mongoose");

const URI =
  `mongodb://${config.user}:${config.pwd}` +
  `@${config.cluster_url}:${config.port}` +
  `/${config.auth_source}` +
  `?authMechanism=${config.auth_mechanism}` +
  `&authSource=${config.auth_source}`;

let isConnected = false;

/**
 * Connects to MongoDB database using Mongoose
 * @returns {Promise<boolean>} Connection success status
 */
async function connectDB() {
  try {
    await mongoose.connect(URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    logger.info("Successfully connected to MongoDB via Mongoose");
    isConnected = true;

    // Handle connection events
    mongoose.connection.on("error", (error) => {
      logger.error(`MongoDB connection error: ${error.message}`);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
      isConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
      isConnected = true;
    });

    return true;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    isConnected = false;
    return false;
  }
}

/**
 * Ensures database is connected
 * @throws {Error} If database is not connected
 */
function ensureConnected() {
  if (!isConnected || mongoose.connection.readyState !== 1) {
    throw new Error(
      "Database not connected. Please wait for connection to establish."
    );
  }
}

/**
 * Closes database connection
 * @returns {Promise<void>}
 */
async function closeDB() {
  try {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed");
    isConnected = false;
  } catch (error) {
    logger.error(`Error closing MongoDB connection: ${error.message}`);
    throw error;
  }
}

/**
 * Gets connection status
 * @returns {boolean}
 */
function getConnectionStatus() {
  return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Initializes database connection with retry logic
 */
async function init() {
  const connected = await connectDB();
  if (!connected) {
    logger.warn("Failed to connect to MongoDB. Retrying in 10 seconds...");
    setTimeout(init, 10000);
    return;
  }

  logger.info("Database initialized successfully");
}

module.exports = {
  init,
  connectDB,
  closeDB,
  ensureConnected,
  getConnectionStatus,
  mongoose,
};
