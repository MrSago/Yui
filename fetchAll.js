async function fetchAll(client) {
  await client.guilds.fetch();
  await client.guilds.cache.forEach(async (guild) => {
    await guild.channels.fetch();
  });
}

module.exports = {
  fetchAll: fetchAll,
};
