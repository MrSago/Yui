async function fetchAll(client) {
  await client.guilds.fetch();
  await client.guilds.cache.forEach(async (guild) => {
    await guild.channels.fetch();
  });
}

async function fetchGuild(guild) {
  await guild.fetch();
  await guild.channels.fetch();
}

module.exports = {
  fetchAll: fetchAll,
  fetchGuild: fetchGuild,
};
