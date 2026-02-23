/**
 * @file Guild delete event handler
 * @description Handles bot being removed from a Discord server
 */

const { Events } = require("discord.js");

const { clearGuildSettings } = require("../../db/database.js");
const logger = require("../../logger.js").child({
  module: "discord/events/guildDelete",
});

module.exports = {
  name: Events.GuildDelete,
  once: false,

  /**
   * Executes when bot is removed from a guild
   * @param {import('discord.js').Guild} guild - Discord guild object
   */
  async execute(guild) {
    logger.info(
      { guild_name: guild.name, guild_id: guild.id },
      "Bot removed from Discord server",
    );

    await logger.discord(`➖ Left server: **${guild.name}** (${guild.id})`);

    try {
      await clearGuildSettings(guild.id);
      logger.info(
        { guild_id: guild.id },
        "Successfully cleared settings for guild",
      );
    } catch (error) {
      logger.error(
        { guild_id: guild.id, err: error },
        "Error clearing settings for guild",
      );
    }
  },
};
