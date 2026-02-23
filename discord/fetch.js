/**
 * @file Discord fetch utilities
 * @description Helper functions for fetching Discord guild metadata
 */

const logger = require("../logger.js").child({ module: "discord/fetch" });

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
    logger.info({ count: client.guilds.cache.size }, "Fetched guilds");
    logger.info(
      "Skipping eager channel fetch; channels will be loaded on demand",
    );
  } catch (error) {
    logger.error({ err: error }, "Error fetching guilds:");
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
    logger.debug(
      { guild_name: guild.name, guild_id: guild.id },
      "Fetching guild",
    );
    await guild.fetch();
    logger.debug(
      { guild_name: guild.name, guild_id: guild.id },
      "Fetched guild metadata",
    );
  } catch (error) {
    logger.error(
      { guild_name: guild.name, guild_id: guild.id, err: error },
      "Error fetching guild",
    );
  }
}

module.exports = {
  fetchAll: fetchAll,
  fetchGuild: fetchGuild,
};
