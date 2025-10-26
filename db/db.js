const { init } = require("./connection.js");
const changelog = require("./changelog.db.js");
const loot = require("./loot.db.js");
const records = require("./records.db.js");
const settings = require("./settings.db.js");
const changelogLogs = require("./changelogLogs.db.js");

module.exports = {
  init,

  // Changelog operations
  setChangelogChannel: changelog.setChangelogChannel,
  deleteChangelogChannel: changelog.deleteChangelogChannel,
  getChangelogSettings: changelog.getChangelogSettings,

  // Changelog logs operations
  getChangelogLogs: changelogLogs.getChangelogLogs,
  saveChangelogLogs: changelogLogs.saveChangelogLogs,
  appendChangelogLogs: changelogLogs.appendChangelogLogs,

  // Loot operations
  setLootChannel: loot.setLootChannel,
  deleteLootChannel: loot.deleteLootChannel,
  getLootSettings: loot.getLootSettings,
  getGuildIdByLootId: loot.getGuildIdByLootId,

  // Records operations
  initRecords: records.initRecords,
  deleteRecords: records.deleteRecords,
  pushRecords: records.pushRecords,
  checkRecord: records.checkRecord,

  // Settings operations
  getSettingsArray: settings.getSettingsArray,
  clearInactiveGuildsFromDb: settings.clearInactiveGuildsFromDb,
  clearGuildSettings: settings.clearGuildSettings,
  getGuildsCount: settings.getGuildsCount,
};
