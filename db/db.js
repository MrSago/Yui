const config = require("../environment.js").db;
const { MongoClient } = require("mongodb");

const uri =
  `mongodb://${config.user}:${config.pwd}` +
  `@${config.cluster_url}:${config.port}` +
  `/?authMechanism=${config.auth_mechanism}` +
  `&authSource=${config.auth_source}`;

const client = new MongoClient(uri);
const db = client.db(config.auth_source);
const settings = db.collection("settings");
const changelog = db.collection("changelog");
const loot = db.collection("loot");

function init() {
  settings.createIndex({ discord_id: 1 }, { unique: true });
  settings.createIndex({ changelog_id: 2 });
  settings.createIndex({ loot_id: 2 });

  changelog.createIndex({ channel_id: 2 });

  loot.createIndex({ channel_id: 2 });
  loot.createIndex({ realm_id: 2 });
  loot.createIndex({ guild_sirus_id: 2 });
}

async function setChangelogChannel(discord_id, channel_id) {
  const changelog_settings = await settings.findOne({ discord_id: discord_id });
  if (!changelog_settings) {
    let result = await changelog.insertOne({ channel_id: channel_id });
    await settings.insertOne({
      discord_id: discord_id,
      changelog_id: result.insertedId,
    });
  } else {
    await changelog.updateOne(
      { _id: changelog_settings.changelog_id },
      { $set: { channel_id: channel_id } }
    );
  }
}

async function deleteChangelogChannel(discord_id) {
  const changelog_settings = await settings.findOne({ discord_id: discord_id });
  if (!changelog_settings) {
    return false;
  }

  let result = await changelog.deleteOne({
    _id: changelog_settings.changelog_id,
  });
  if (!result.deletedCount) {
    return false;
  }
  result = await settings.deleteOne({ discord_id: discord_id });
  if (!result.deletedCount) {
    return false;
  }
  return true;
}

async function getChangelogSettings() {
  return await changelog.find().toArray();
}

async function getChangelogChannel(discord_id) {
  const changelog_settings = await settings.findOne({ discord_id: discord_id });
  if (!changelog_settings) {
    return null;
  }

  const doc = await changelog.findOne({
    _id: changelog_settings.changelog_id,
  });
  return doc.channel_id;
}

module.exports = {
  init: init,
  setChangelogChannel: setChangelogChannel,
  deleteChangelogChannel: deleteChangelogChannel,
  getChangelogSettings: getChangelogSettings,
  getChangelogChannel: getChangelogChannel,
};
