/**
 * @file Guild delete event handler
 * @description Handles bot being removed from a Discord server
 */

const logger = require("../logger.js");
const { clearGuildSettings } = require("../db/db.js");

const { Events } = require("discord.js");

module.exports = {
  name: Events.GuildDelete,
  once: false,

  /**
   * Executes when bot is removed from a guild
   * @param {import('discord.js').Guild} guild - Discord guild object
   */
  async execute(guild) {
    logger.discord(`Discord server deleted: ${guild.name} (${guild.id})`);
    clearGuildSettings(guild.id);
  },
};
