const ChangelogService = require("./ChangelogService.js");
const LootService = require("./LootService.js");
const RecordsService = require("./RecordsService.js");
const SettingsService = require("./SettingsService.js");
const ChangelogDataService = require("./ChangelogDataService.js");
const LootTooltipCacheService = require("./LootTooltipCacheService.js");
const LootTooltipStyleService = require("./LootTooltipStyleService.js");

const changelogService = new ChangelogService();
const lootService = new LootService();
const recordsService = new RecordsService();
const settingsService = new SettingsService();
const changelogDataService = new ChangelogDataService();
const lootTooltipCacheService = new LootTooltipCacheService();
const lootTooltipStyleService = new LootTooltipStyleService();

module.exports = {
  changelogService,
  lootService,
  recordsService,
  settingsService,
  changelogDataService,
  lootTooltipCacheService,
  lootTooltipStyleService,
};
