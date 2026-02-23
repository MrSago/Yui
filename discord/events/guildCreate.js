/**
 * @file Guild create event handler
 * @description Handles bot joining a new Discord server
 */

const { Events } = require("discord.js");

const { fetchGuild } = require("../fetch.js");
const logger = require("../../logger.js").child({
  module: "discord/events/guildCreate",
});

module.exports = {
  name: Events.GuildCreate,
  once: false,

  /**
   * Executes when bot joins a new guild
   * @param {import('discord.js').Guild} guild - Discord guild object
   */
  async execute(guild) {
    logger.info(
      { guild_name: guild.name, guild_id: guild.id },
      "Bot joined Discord server",
    );
    logger.info({ member_count: guild.memberCount }, "Server members");

    await logger.discord(
      `➕ Joined server: **${guild.name}** (${guild.id}) | Members: ${guild.memberCount}`,
    );

    try {
      await fetchGuild(guild);
      logger.debug(
        { guild_name: guild.name, guild_id: guild.id },
        "Successfully fetched guild data",
      );
    } catch (e) {
      logger.error(
        { guild_name: guild.name, guild_id: guild.id, err: e },
        "Error fetching guild data",
      );
    }
  },
};
