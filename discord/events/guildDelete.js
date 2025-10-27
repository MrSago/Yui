/**
 * @file Guild delete event handler
 * @description Handles bot being removed from a Discord server
 */

const logger = require("../../logger.js");
const { clearGuildSettings } = require("../../db/database.js");

const { Events } = require("discord.js");

module.exports = {
  name: Events.GuildDelete,
  once: false,

  /**
   * Executes when bot is removed from a guild
   * @param {import('discord.js').Guild} guild - Discord guild object
   */
  async execute(guild) {
    logger.info(`Bot removed from Discord server: ${guild.name} (${guild.id})`);

    logger.discord(`➖ Left server: **${guild.name}** (${guild.id})`);

    try {
      await clearGuildSettings(guild.id);
      logger.info(`Successfully cleared settings for guild ${guild.id}`);
    } catch (error) {
      logger.error(
        `Error clearing settings for guild ${guild.id}: ${error.message}`
      );
      logger.error(error);
    }
  },
};
