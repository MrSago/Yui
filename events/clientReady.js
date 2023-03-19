const { Events } = require("discord.js");

module.exports = {
    name: Events.ClientReady,
    once: true,

    async execute(client) {
        require("../changelog.js").initChangeLog(client);
        require("../loot.js").initLoot(client);
        console.log(`Ready! Logged in as ${client.user.tag}`);
    },
};
