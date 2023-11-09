const { Events } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    require("../db/db.js").init();
    require("../changelog/changelog.js").init(client);
    require("../loot/loot.js").init(client);
    console.log(`Ready! Logged in as ${client.user.tag}`);
  },
};
