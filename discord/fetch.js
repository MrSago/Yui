/**
 * @file Discord fetch utilities
 * @description Helper functions for fetching Discord guilds and channels
 */

const logger = require("../logger.js");

/**
 * Fetches all guilds and their channels for the client
 * @param {import('discord.js').Client} client - Discord client instance
 * @returns {Promise<void>}
 */
async function fetchAll(client) {
  try {
    logger.info("Fetching all guilds...");
    await client.guilds.fetch();
    logger.info(`Fetched ${client.guilds.cache.size} guilds`);

    logger.info("Fetching channels for all guilds...");
    let channelCount = 0;

    await Promise.all(
      client.guilds.cache.map(async (guild) => {
        await guild.channels.fetch();
        channelCount += guild.channels.cache.size;
        logger.debug(
          `Fetched ${guild.channels.cache.size} channels for guild ${guild.name}`,
        );
      }),
    );

    logger.info(`Fetched ${channelCount} channels total`);
  } catch (error) {
    logger.error(`Error fetching guilds and channels: ${error.message}`);
    logger.error(error);
  }
}

/**
 * Fetches a specific guild and its channels
 * @param {import('discord.js').Guild} guild - Discord guild to fetch
 * @returns {Promise<void>}
 */
async function fetchGuild(guild) {
  try {
    logger.debug(`Fetching guild ${guild.name}...`);
    await guild.fetch();
    await guild.channels.fetch();
    logger.debug(
      `Fetched ${guild.channels.cache.size} channels for guild ${guild.name}`,
    );
  } catch (error) {
    logger.error(`Error fetching guild ${guild.name}: ${error.message}`);
    logger.error(error);
  }
}

module.exports = {
  fetchAll: fetchAll,
  fetchGuild: fetchGuild,
};
