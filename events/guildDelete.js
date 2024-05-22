const logger = require("../logger.js");
const { clearGuildSettings } = require("../db/db.js");

const { Events } = require("discord.js");

module.exports = {
  name: Events.GuildDelete,
  once: false,

  async execute(guild) {
    logger.discord(`Discord server deleted: ${guild.name} (${guild.id})`);
    clearGuildSettings(guild.id);
  },
};
