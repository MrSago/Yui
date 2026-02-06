/**
 * Repositories Index
 * Exports all repository instances
 */

const ChangelogRepository = require("./ChangelogRepository.js");
const ChangelogDataRepository = require("./ChangelogDataRepository.js");
const LootRepository = require("./LootRepository.js");
const LootTooltipCacheRepository = require("./LootTooltipCacheRepository.js");
const LootTooltipStyleRepository = require("./LootTooltipStyleRepository.js");
const RecordsRepository = require("./RecordsRepository.js");
const SettingsRepository = require("./SettingsRepository.js");

const changelogRepository = new ChangelogRepository();
const changelogDataRepository = new ChangelogDataRepository();
const lootRepository = new LootRepository();
const lootTooltipCacheRepository = new LootTooltipCacheRepository();
const lootTooltipStyleRepository = new LootTooltipStyleRepository();
const recordsRepository = new RecordsRepository();
const settingsRepository = new SettingsRepository();

module.exports = {
  changelogRepository,
  changelogDataRepository,
  lootRepository,
  lootTooltipCacheRepository,
  lootTooltipStyleRepository,
  recordsRepository,
  settingsRepository,
};
