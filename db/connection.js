const config = require("../environment.js").db;
const logger = require("../logger.js");
const { MongoClient } = require("mongodb");

const URI =
  `mongodb://${config.user}:${config.pwd}` +
  `@${config.cluster_url}:${config.port}` +
  `/?authMechanism=${config.auth_mechanism}` +
  `&authSource=${config.auth_source}`;

const client = new MongoClient(URI, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
});

let db;
let collections = {};
let isConnected = false;

/**
 * Connects to MongoDB database
 * @returns {Promise<boolean>} Connection success status
 */
async function connectDB() {
  try {
    await client.connect();
    logger.info("Successfully connected to MongoDB");

    db = client.db(config.auth_source);
    collections.settings = db.collection("settings");
    collections.changelog = db.collection("changelog");
    collections.loot = db.collection("loot");
    collections.records = db.collection("records");
    collections.changelogLogs = db.collection("changelog_logs");

    isConnected = true;
    return true;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    isConnected = false;
    return false;
  }
}

/**
 * Ensures database is connected, throws error if not
 * @throws {Error} If database is not connected
 */
function ensureConnected() {
  if (
    !isConnected ||
    !collections.settings ||
    !collections.changelog ||
    !collections.loot ||
    !collections.records ||
    !collections.changelogLogs
  ) {
    throw new Error(
      "Database not connected. Please wait for connection to establish."
    );
  }
}

/**
 * Gets a specific collection
 * @param {string} name - Collection name
 * @returns {import('mongodb').Collection} MongoDB collection
 */
function getCollection(name) {
  ensureConnected();
  return collections[name];
}

/**
 * Initializes database connection and indexes
 */
async function init() {
  const connected = await connectDB();
  if (!connected) {
    logger.warn("Failed to connect to MongoDB. Retrying in 10 seconds...");
    setTimeout(init, 10000);
    return;
  }

  try {
    await collections.settings.createIndex({ guild_id: 1 }, { unique: true });
    await collections.settings.createIndex({ changelog_id: 2 });
    await collections.settings.createIndex({ loot_id: 2 });

    await collections.changelog.createIndex({ channel_id: 2 });

    await collections.loot.createIndex({ channel_id: 2 });
    await collections.loot.createIndex({ realm_id: 2 });
    await collections.loot.createIndex({ guild_sirus_id: 2 });

    await collections.records.createIndex({ guild_id: 1 }, { unique: true });
    await collections.records.createIndex({ records: 2 });

    await collections.changelogLogs.createIndex({ _id: 1 });

    logger.info("MongoDB indexes created successfully");
  } catch (error) {
    logger.error(`Error creating indexes: ${error.message}`);
  }
}

client.on("error", (error) => {
  logger.error(`MongoDB client error: ${error.message}`);
});

client.on("close", () => {
  logger.warn("MongoDB connection closed");
  isConnected = false;
});

module.exports = {
  init,
  ensureConnected,
  getCollection,
};
