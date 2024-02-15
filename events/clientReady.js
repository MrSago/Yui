const logger = require("../logger.js");
const { getGuildCount } = require("../db/db.js");

const { Events } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    require("../logger.js").init(client, "debug");
    require("../db/db.js").init();
    require("../changelog/changelog.js").init(client);
    require("../loot/loot.js").init(client);
  
    logger.discord(`Ready! Logged in as ${client.user}`);
    logger.discord(`Count of discord servers: ${client.guilds.cache.size}`);
    logger.discord(`Count of database settings records: ${await getGuildCount()}`);
  },
};
