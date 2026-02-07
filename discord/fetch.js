/**
 * @file Discord fetch utilities
 * @description Helper functions for fetching Discord guild metadata
 */

const logger = require("../logger.js");

/**
 * Fetches all guilds for the client
 * Channel data is intentionally resolved lazily on demand.
 * @param {import('discord.js').Client} client - Discord client instance
 * @returns {Promise<void>}
 */
async function fetchAll(client) {
  try {
    logger.info("Fetching all guilds...");
    await client.guilds.fetch();
    logger.info(`Fetched ${client.guilds.cache.size} guilds`);
    logger.info("Skipping eager channel fetch; channels will be loaded on demand");
  } catch (error) {
    logger.error(`Error fetching guilds: ${error.message}`);
    logger.error(error);
  }
}

/**
 * Fetches a specific guild
 * Channel data is intentionally resolved lazily on demand.
 * @param {import('discord.js').Guild} guild - Discord guild to fetch
 * @returns {Promise<void>}
 */
async function fetchGuild(guild) {
  try {
    logger.debug(`Fetching guild ${guild.name}...`);
    await guild.fetch();
    logger.debug(`Fetched guild metadata for ${guild.name}`);
  } catch (error) {
    logger.error(`Error fetching guild ${guild.name}: ${error.message}`);
    logger.error(error);
  }
}

module.exports = {
  fetchAll: fetchAll,
  fetchGuild: fetchGuild,
};
