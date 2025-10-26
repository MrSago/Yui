/**
 * @file Discord fetch utilities
 * @description Helper functions for fetching Discord guilds and channels
 */

/**
 * Fetches all guilds and their channels for the client
 * @param {import('discord.js').Client} client - Discord client instance
 * @returns {Promise<void>}
 */
async function fetchAll(client) {
  await client.guilds.fetch();
  await client.guilds.cache.forEach(async (guild) => {
    await guild.channels.fetch();
  });
}

/**
 * Fetches a specific guild and its channels
 * @param {import('discord.js').Guild} guild - Discord guild to fetch
 * @returns {Promise<void>}
 */
async function fetchGuild(guild) {
  await guild.fetch();
  await guild.channels.fetch();
}

module.exports = {
  fetchAll: fetchAll,
  fetchGuild: fetchGuild,
};
