const logger = require("../logger.js");
const { ensureConnected, getCollection } = require("./connection.js");

/**
 * Sets loot channel for a guild
 * @param {string} guild_id - Discord guild ID
 * @param {string} channel_id - Discord channel ID
 * @param {number} realm_id - Realm ID
 * @param {number} guild_sirus_id - Guild Sirus ID
 * @returns {Promise<void>}
 */
async function setLootChannel(guild_id, channel_id, realm_id, guild_sirus_id) {
  ensureConnected();
  try {
    const settings = getCollection("settings");
    const loot = getCollection("loot");

    const guild_settings = await settings.findOne({ guild_id: guild_id });
    if (!guild_settings) {
      const result = await loot.insertOne({
        channel_id: channel_id,
        realm_id: realm_id,
        guild_sirus_id: guild_sirus_id,
      });
      await settings.insertOne({
        guild_id: guild_id,
        loot_id: result.insertedId,
      });
      return;
    }

    if (!guild_settings.loot_id) {
      const result = await loot.insertOne({
        channel_id: channel_id,
        realm_id: realm_id,
        guild_sirus_id: guild_sirus_id,
      });
      await settings.updateOne(
        { guild_id: guild_id },
        { $set: { loot_id: result.insertedId } }
      );
      return;
    }

    await loot.updateOne(
      { _id: guild_settings.loot_id },
      {
        $set: {
          channel_id: channel_id,
          realm_id: realm_id,
          guild_sirus_id: guild_sirus_id,
        },
      }
    );
  } catch (error) {
    logger.error(`Error setting loot channel: ${error.message}`);
    throw error;
  }
}

/**
 * Deletes loot channel for a guild
 * @param {string} guild_id - Discord guild ID
 * @returns {Promise<void>}
 */
async function deleteLootChannel(guild_id) {
  ensureConnected();
  try {
    const settings = getCollection("settings");
    const loot = getCollection("loot");

    const guild_settings = await settings.findOne({ guild_id: guild_id });
    if (!guild_settings || !guild_settings.loot_id) {
      return;
    }

    const result = await loot.deleteOne({
      _id: guild_settings.loot_id,
    });
    if (!result.deletedCount) {
      return;
    }

    await settings.updateOne(
      { guild_id: guild_id },
      { $unset: { loot_id: 1 } }
    );
  } catch (error) {
    logger.error(`Error deleting loot channel: ${error.message}`);
    throw error;
  }
}

/**
 * Gets all loot settings
 * @returns {Promise<Array|null>} Array of loot settings or null
 */
async function getLootSettings() {
  ensureConnected();
  try {
    const loot = getCollection("loot");
    const entry = loot.find();
    if (!entry) {
      return null;
    }
    return await entry.toArray();
  } catch (error) {
    logger.error(`Error getting loot settings: ${error.message}`);
    return null;
  }
}

/**
 * Gets guild ID by loot ID
 * @param {import('mongodb').ObjectId} loot_id - Loot ID
 * @returns {Promise<string|null>} Guild ID or null
 */
async function getGuildIdByLootId(loot_id) {
  ensureConnected();
  try {
    const settings = getCollection("settings");
    const entry = await settings.findOne(
      { loot_id: loot_id },
      { projection: { _id: 0, guild_id: 1 } }
    );
    if (!entry || !entry.guild_id) {
      return null;
    }
    return entry.guild_id;
  } catch (error) {
    logger.error(`Error getting guild ID by loot ID: ${error.message}`);
    return null;
  }
}

module.exports = {
  setLootChannel,
  deleteLootChannel,
  getLootSettings,
  getGuildIdByLootId,
};
