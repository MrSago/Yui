/**
 * Repositories Index
 * Exports all repository instances
 */

const SettingsRepository = require("./SettingsRepository.js");
const ChangelogRepository = require("./ChangelogRepository.js");
const LootRepository = require("./LootRepository.js");
const RecordsRepository = require("./RecordsRepository.js");
const ChangelogDataRepository = require("./ChangelogDataRepository.js");

// Create singleton instances
const settingsRepository = new SettingsRepository();
const changelogRepository = new ChangelogRepository();
const lootRepository = new LootRepository();
const recordsRepository = new RecordsRepository();
const changelogDataRepository = new ChangelogDataRepository();

module.exports = {
  settingsRepository,
  changelogRepository,
  lootRepository,
  recordsRepository,
  changelogDataRepository,
};
