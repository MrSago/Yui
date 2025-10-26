const ChangelogService = require("./ChangelogService.js");
const LootService = require("./LootService.js");
const RecordsService = require("./RecordsService.js");
const SettingsService = require("./SettingsService.js");
const ChangelogDataService = require("./ChangelogDataService.js");

// Create singleton instances
const changelogService = new ChangelogService();
const lootService = new LootService();
const recordsService = new RecordsService();
const settingsService = new SettingsService();
const changelogDataService = new ChangelogDataService();

module.exports = {
  changelogService,
  lootService,
  recordsService,
  settingsService,
  changelogDataService,
};
