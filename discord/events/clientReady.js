/**
 * @file Client ready event handler
 * @description Handles bot initialization when Discord client is ready
 */

const { Events } = require("discord.js");

const {
  clearInactiveGuildsFromDb,
  getGuildsCount,
} = require("../../db/database.js");
const logger = require("../../logger.js");

module.exports = {
  name: Events.ClientReady,
  once: true,

  /**
   * Executes when Discord client becomes ready
   * @param {import('discord.js').Client} client - Discord client instance
   */
  async execute(client) {
    logger.info("Initializing logger with Discord client...");
    require("../../logger.js").init(client);

    logger.info("Discord client ready event triggered");
    logger.info(`Logged in as ${client.user.tag}`);

    logger.info("Fetching Discord data...");
    await require("../fetch.js").fetchAll(client);

    logger.info("Initializing changelog module...");
    require("../../changelog/changelog.js").init(client);

    logger.info("Initializing loot module...");
    require("../../loot/loot.js").init(client);

    logger.info("Cleaning up inactive guilds from database...");
    const removed_guilds = await clearInactiveGuildsFromDb(client);
    const db_guilds = await getGuildsCount();

    logger.discord(`✅ Bot Ready! Logged in as ${client.user}`);
    logger.discord(`📊 Discord guilds: ${client.guilds.cache.size}`);
    logger.discord(`💾 Database records: ${db_guilds}`);
    logger.discord(`🗑️ Removed inactive guilds: ${removed_guilds}`);

    logger.info("Bot initialization completed successfully");
  },
};
