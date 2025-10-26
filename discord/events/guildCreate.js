/**
 * @file Guild create event handler
 * @description Handles bot joining a new Discord server
 */

const logger = require("../../logger.js");
const { fetchGuild } = require("../fetch.js");

const { Events } = require("discord.js");

module.exports = {
  name: Events.GuildCreate,
  once: false,

  /**
   * Executes when bot joins a new guild
   * @param {import('discord.js').Guild} guild - Discord guild object
   */
  async execute(guild) {
    logger.discord(`Discord server joined: ${guild.name} (${guild.id})`);
    try {
      fetchGuild(guild);
    } catch (e) {
      logger.error(e);
    }
  },
};
