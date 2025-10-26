const config = require("../environment.js").db;
const logger = require("../logger.js");
const mongoose = require("mongoose");

const URI =
  `mongodb://${config.user}:${config.pwd}` +
  `@${config.cluster_url}:${config.port}` +
  `/${config.auth_source}` +
  `?authMechanism=${config.auth_mechanism}` +
  `&authSource=${config.auth_source}`;

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

    mongoose.connection.on("error", (error) => {
      logger.error(`MongoDB connection error: ${error.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });

    return true;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    return false;
  }
}

module.exports = {
  init,
};
