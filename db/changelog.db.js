const logger = require("../logger.js");
const { ensureConnected, getCollection } = require("./connection.js");

/**
 * Sets changelog channel for a guild
 * @param {string} guild_id - Discord guild ID
 * @param {string} channel_id - Discord channel ID
 * @returns {Promise<void>}
 */
async function setChangelogChannel(guild_id, channel_id) {
  ensureConnected();
  try {
    const settings = getCollection("settings");
    const changelog = getCollection("changelog");

    const guild_settings = await settings.findOne({ guild_id: guild_id });
    if (!guild_settings) {
      const result = await changelog.insertOne({ channel_id: channel_id });
      await settings.insertOne({
        guild_id: guild_id,
        changelog_id: result.insertedId,
      });
      return;
    }

    if (!guild_settings.changelog_id) {
      const result = await changelog.insertOne({ channel_id: channel_id });
      await settings.updateOne(
        { guild_id: guild_id },
        { $set: { changelog_id: result.insertedId } }
      );
      return;
    }

    await changelog.updateOne(
      { _id: guild_settings.changelog_id },
      { $set: { channel_id: channel_id } }
    );
  } catch (error) {
    logger.error(`Error setting changelog channel: ${error.message}`);
    throw error;
  }
}

/**
 * Deletes changelog channel for a guild
 * @param {string} guild_id - Discord guild ID
 * @returns {Promise<void>}
 */
async function deleteChangelogChannel(guild_id) {
  ensureConnected();
  try {
    const settings = getCollection("settings");
    const changelog = getCollection("changelog");

    const guild_settings = await settings.findOne({ guild_id: guild_id });
    if (!guild_settings || !guild_settings.changelog_id) {
      return;
    }

    const result = await changelog.deleteOne({
      _id: guild_settings.changelog_id,
    });
    if (!result.deletedCount) {
      return;
    }

    await settings.updateOne(
      { guild_id: guild_id },
      { $unset: { changelog_id: 1 } }
    );
  } catch (error) {
    logger.error(`Error deleting changelog channel: ${error.message}`);
    throw error;
  }
}

/**
 * Gets all changelog settings
 * @returns {Promise<Array|null>} Array of changelog settings or null
 */
async function getChangelogSettings() {
  ensureConnected();
  try {
    const changelog = getCollection("changelog");
    const entry = changelog.find();
    if (!entry) {
      return null;
    }
    return await entry.toArray();
  } catch (error) {
    logger.error(`Error getting changelog settings: ${error.message}`);
    return null;
  }
}

module.exports = {
  setChangelogChannel,
  deleteChangelogChannel,
  getChangelogSettings,
};
