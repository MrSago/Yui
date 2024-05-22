const config = require("../environment.js").db;

const { MongoClient } = require("mongodb");

const URI =
  `mongodb://${config.user}:${config.pwd}` +
  `@${config.cluster_url}:${config.port}` +
  `/?authMechanism=${config.auth_mechanism}` +
  `&authSource=${config.auth_source}`;

const client = new MongoClient(URI);
const db = client.db(config.auth_source);

const settings = db.collection("settings");
const changelog = db.collection("changelog");
const loot = db.collection("loot");

const records = db.collection("records");

function init() {
  settings.createIndex({ guild_id: 1 }, { unique: true });
  settings.createIndex({ changelog_id: 2 });
  settings.createIndex({ loot_id: 2 });

  changelog.createIndex({ channel_id: 2 });

  loot.createIndex({ channel_id: 2 });
  loot.createIndex({ realm_id: 2 });
  loot.createIndex({ guild_sirus_id: 2 });

  records.createIndex({ guild_id: 1 }, { unique: true });
  records.createIndex({ records: 2 });
}

async function setChangelogChannel(guild_id, channel_id) {
  const guild_settings = await settings.findOne({ guild_id: guild_id });
  if (!guild_settings) {
    const result = await changelog.insertOne({ channel_id: channel_id });
    await settings.insertOne({
      guild_id: guild_id,
      changelog_id: result.insertedId,
    });
    return;
  }

  if (!guild_settings.changelog_id) {
    const result = await changelog.insertOne({ channel_id: channel_id });
    await settings.updateOne(
      { guild_id: guild_id },
      { $set: { changelog_id: result.insertedId } }
    );
    return;
  }

  await changelog.updateOne(
    { _id: guild_settings.changelog_id },
    { $set: { channel_id: channel_id } }
  );
}

async function deleteChangelogChannel(guild_id) {
  const guild_settings = await settings.findOne({ guild_id: guild_id });
  if (!guild_settings || !guild_settings.changelog_id) {
    return;
  }

  const result = await changelog.deleteOne({
    _id: guild_settings.changelog_id,
  });
  if (!result.deletedCount) {
    return;
  }

  await settings.updateOne(
    { guild_id: guild_id },
    { $unset: { changelog_id: 1 } }
  );
}

async function getChangelogSettings() {
  const entry = changelog.find();
  if (!entry) {
    return null;
  }
  return await entry.toArray();
}

async function setLootChannel(guild_id, channel_id, realm_id, guild_sirus_id) {
  const guild_settings = await settings.findOne({ guild_id: guild_id });
  if (!guild_settings) {
    const result = await loot.insertOne({
      channel_id: channel_id,
      realm_id: realm_id,
      guild_sirus_id: guild_sirus_id,
    });
    await settings.insertOne({
      guild_id: guild_id,
      loot_id: result.insertedId,
    });
    return;
  }

  if (!guild_settings.loot_id) {
    const result = await loot.insertOne({
      channel_id: channel_id,
      realm_id: realm_id,
      guild_sirus_id: guild_sirus_id,
    });
    await settings.updateOne(
      { guild_id: guild_id },
      { $set: { loot_id: result.insertedId } }
    );
    return;
  }

  await loot.updateOne(
    { _id: guild_settings.loot_id },
    {
      $set: {
        channel_id: channel_id,
        realm_id: realm_id,
        guild_sirus_id: guild_sirus_id,
      },
    }
  );
}

async function deleteLootChannel(guild_id) {
  const guild_settings = await settings.findOne({ guild_id: guild_id });
  if (!guild_settings || !guild_settings.loot_id) {
    return;
  }

  const result = await loot.deleteOne({
    _id: guild_settings.loot_id,
  });
  if (!result.deletedCount) {
    return;
  }

  await settings.updateOne({ guild_id: guild_id }, { $unset: { loot_id: 1 } });
}

async function getLootSettings() {
  const entry = loot.find();
  if (!entry) {
    return null;
  }
  return await entry.toArray();
}

async function getGuildIdByLootId(loot_id) {
  const entry = await settings.findOne(
    { loot_id: loot_id },
    { projection: { _id: 0, guild_id: 1 } }
  );
  if (!entry || !entry.guild_id) {
    return null;
  }
  return entry.guild_id;
}

async function initRecords(guild_id) {
  const entry = await records.findOne({ guild_id: guild_id });
  if (!entry) {
    await records.insertOne({ guild_id: guild_id, records: [] });
    return true;
  }
  return false;
}

async function deleteRecords(guild_id) {
  const entry = await records.findOne({ guild_id: guild_id });
  if (!entry) {
    return;
  }
  await records.deleteOne({ guild_id: guild_id });
}

async function pushRecords(guild_id, push_recs) {
  const entry = await records.findOne({ guild_id: guild_id });
  if (!entry) {
    return false;
  }
  await records.updateOne(
    { guild_id: guild_id },
    { $addToSet: { records: { $each: push_recs } } }
  );
  return true;
}

async function checkRecord(guild_id, record) {
  const entry = await records.findOne({
    guild_id: guild_id,
    records: { $in: [record] },
  });
  if (!entry) {
    return false;
  }
  return true;
}

async function getSettingsArray() {
  return await settings.find({}).toArray();
}

function clearGuildSettings(guild_id) {
  deleteChangelogChannel(guild_id);
  deleteLootChannel(guild_id);
  deleteRecords(guild_id);
  settings.deleteOne({ guild_id: guild_id });
}

async function getGuildsCount() {
  return await settings.countDocuments();
}

module.exports = {
  init: init,

  setChangelogChannel: setChangelogChannel,
  deleteChangelogChannel: deleteChangelogChannel,
  getChangelogSettings: getChangelogSettings,

  setLootChannel: setLootChannel,
  deleteLootChannel: deleteLootChannel,
  getLootSettings: getLootSettings,
  getGuildIdByLootId: getGuildIdByLootId,

  initRecords: initRecords,
  deleteRecords: deleteRecords,
  pushRecords: pushRecords,
  checkRecord: checkRecord,

  getSettingsArray: getSettingsArray,
  clearGuildSettings: clearGuildSettings,
  getGuildsCount: getGuildsCount,
};
