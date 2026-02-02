/**
 * @file Guild create event handler
 * @description Handles bot joining a new Discord server
 */

const { Events } = require("discord.js");

const { fetchGuild } = require("../fetch.js");
const logger = require("../../logger.js");

module.exports = {
  name: Events.GuildCreate,
  once: false,

  /**
   * Executes when bot joins a new guild
   * @param {import('discord.js').Guild} guild - Discord guild object
   */
  async execute(guild) {
    logger.info(`Bot joined new Discord server: ${guild.name} (${guild.id})`);
    logger.info(`Server members: ${guild.memberCount}`);

    logger.discord(
      `➕ Joined server: **${guild.name}** (${guild.id}) | Members: ${guild.memberCount}`,
    );

    try {
      fetchGuild(guild);
      logger.debug(`Successfully fetched guild data for ${guild.name}`);
    } catch (e) {
      logger.error(`Error fetching guild data for ${guild.name}: ${e.message}`);
      logger.error(e);
    }
  },
};
