const logger = require("../logger.js");
const {
  getSettingsArray,
  getGuildsCount,
  clearGuildSettings,
} = require("../db/db.js");

const { Events } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    //await require("../browserGetter.js").init();
    await require("../fetch.js").fetchAll(client);
    require("../logger.js").init(client, "debug");
    require("../db/db.js").init();
    require("../changelog/changelog.js").init(client);
    require("../loot/loot.js").init(client);

    const removed_guilds = await clearInactiveGuildsFromDb(client);
    const db_guilds = await getGuildsCount();

    logger.discord(`Ready! Logged in as ${client.user}`);
    logger.discord(`Discord guilds: ${client.guilds.cache.size}`);
    logger.discord(`Database records: ${db_guilds}`);
    logger.discord(`Removed guilds: ${removed_guilds}`);
  },
};

async function clearInactiveGuildsFromDb(client) {
  const current_guild_ids = client.guilds.cache.map((guild) => guild.id);

  const stored_guild_ids = (await getSettingsArray()).map(
    (settings) => settings.guild_id
  );

  const removed_guild_ids = stored_guild_ids.filter(
    (stored_guild_id) => !current_guild_ids.includes(stored_guild_id)
  );

  for (const guild_id of removed_guild_ids) {
    clearGuildSettings(guild_id);
  }

  return removed_guild_ids.length;
}
