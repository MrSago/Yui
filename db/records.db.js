const logger = require("../logger.js");
const { ensureConnected, getCollection } = require("./connection.js");

/**
 * Initializes records for a guild
 * @param {string} guild_id - Discord guild ID
 * @returns {Promise<boolean>} true if created, false if already exists
 */
async function initRecords(guild_id) {
  ensureConnected();
  try {
    const records = getCollection("records");
    const entry = await records.findOne({ guild_id: guild_id });
    if (!entry) {
      await records.insertOne({ guild_id: guild_id, records: [] });
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Error initializing records: ${error.message}`);
    throw error;
  }
}

/**
 * Deletes records for a guild
 * @param {string} guild_id - Discord guild ID
 * @returns {Promise<void>}
 */
async function deleteRecords(guild_id) {
  ensureConnected();
  try {
    const records = getCollection("records");
    const entry = await records.findOne({ guild_id: guild_id });
    if (!entry) {
      return;
    }
    await records.deleteOne({ guild_id: guild_id });
  } catch (error) {
    logger.error(`Error deleting records: ${error.message}`);
    throw error;
  }
}

/**
 * Pushes new records for a guild
 * @param {string} guild_id - Discord guild ID
 * @param {Array} push_recs - Array of records to push
 * @returns {Promise<boolean>} true on success, false if guild not found
 */
async function pushRecords(guild_id, push_recs) {
  ensureConnected();
  try {
    const records = getCollection("records");
    const entry = await records.findOne({ guild_id: guild_id });
    if (!entry) {
      return false;
    }
    await records.updateOne(
      { guild_id: guild_id },
      { $addToSet: { records: { $each: push_recs } } }
    );
    return true;
  } catch (error) {
    logger.error(`Error pushing records: ${error.message}`);
    return false;
  }
}

/**
 * Checks if a record exists for a guild
 * @param {string} guild_id - Discord guild ID
 * @param {any} record - Record to check
 * @returns {Promise<boolean>} true if record exists, false otherwise
 */
async function checkRecord(guild_id, record) {
  ensureConnected();
  try {
    const records = getCollection("records");
    const entry = await records.findOne({
      guild_id: guild_id,
      records: { $in: [record] },
    });
    if (!entry) {
      return false;
    }
    return true;
  } catch (error) {
    logger.error(`Error checking record: ${error.message}`);
    return false;
  }
}

module.exports = {
  initRecords,
  deleteRecords,
  pushRecords,
  checkRecord,
};
