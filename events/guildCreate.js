const logger = require("../logger.js");
const { fetchGuild } = require("../fetch.js");

const { Events } = require("discord.js");

module.exports = {
  name: Events.GuildCreate,
  once: false,

  async execute(guild) {
    logger.discord(`Discord server joined: ${guild.name} (${guild.id})`);
    try {
      fetchGuild(guild);
    } catch (e) {
      logger.error(e);
    }
  },
};
