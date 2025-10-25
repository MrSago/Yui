const logger = require("../logger.js");
const { ensureConnected, getCollection } = require("./connection.js");
const { deleteChangelogChannel } = require("./changelog.db.js");
const { deleteLootChannel } = require("./loot.db.js");
const { deleteRecords } = require("./records.db.js");

/**
 * Gets all settings as array
 * @returns {Promise<Array>} Array of settings
 */
async function getSettingsArray() {
  ensureConnected();
  try {
    const settings = getCollection("settings");
    return await settings.find({}).toArray();
  } catch (error) {
    logger.error(`Error getting settings array: ${error.message}`);
    return [];
  }
}

/**
 * Clears all settings for a guild
 * @param {string} guild_id - Discord guild ID
 * @returns {Promise<void>}
 */
async function clearGuildSettings(guild_id) {
  ensureConnected();
  try {
    await deleteChangelogChannel(guild_id);
    await deleteLootChannel(guild_id);
    await deleteRecords(guild_id);

    const settings = getCollection("settings");
    await settings.deleteOne({ guild_id: guild_id });
  } catch (error) {
    logger.error(`Error clearing guild settings: ${error.message}`);
    throw error;
  }
}

/**
 * Gets total count of guilds
 * @returns {Promise<number>} Number of guilds
 */
async function getGuildsCount() {
  ensureConnected();
  try {
    const settings = getCollection("settings");
    return await settings.countDocuments();
  } catch (error) {
    logger.error(`Error getting guilds count: ${error.message}`);
    return 0;
  }
}

module.exports = {
  getSettingsArray,
  clearGuildSettings,
  getGuildsCount,
};
