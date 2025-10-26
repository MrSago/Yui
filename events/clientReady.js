/**
 * @file Client ready event handler
 * @description Handles bot initialization when Discord client is ready
 */

const logger = require("../logger.js");
const { clearInactiveGuildsFromDb, getGuildsCount } = require("../db/database.js");

const { Events } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,

  /**
   * Executes when Discord client becomes ready
   * @param {import('discord.js').Client} client - Discord client instance
   */
  async execute(client) {
    await require("../db/database.js").init();
    await require("../fetch.js").fetchAll(client);
    require("../logger.js").init(client, "debug");
    require("../changelog/changelog.js").init(client);
    require("../loot/loot.js").init(client);

    const removed_guilds = await clearInactiveGuildsFromDb(client);
    const db_guilds = await getGuildsCount();

    logger.discord(`Ready! Logged in as ${client.user}`);
    logger.discord(`Discord guilds: ${client.guilds.cache.size}`);
    logger.discord(`Database records: ${db_guilds}`);
    logger.discord(`Removed guilds: ${removed_guilds}`);
  },
};
