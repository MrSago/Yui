const { init } = require("./mongoose.connection.js");

const {
  changelogService,
  changelogDataService,
  lootService,
  lootTooltipCacheService,
  lootTooltipStyleService,
  recordsService,
  settingsService,
} = require("./services/index.js");

/**
 * Database Module
 * Provides unified interface for all database operations using Repository pattern
 */
module.exports = {
  // Initialize database connection
  init,

  // Changelog operations
  setChangelogChannel:
    changelogService.setChangelogChannel.bind(changelogService),
  deleteChangelogChannel:
    changelogService.deleteChangelogChannel.bind(changelogService),
  getChangelogSettings:
    changelogService.getChangelogSettings.bind(changelogService),

  // Changelog data operations
  getChangelogData:
    changelogDataService.getChangelogData.bind(changelogDataService),
  saveChangelogData:
    changelogDataService.saveChangelogData.bind(changelogDataService),
  appendChangelogData:
    changelogDataService.appendChangelogData.bind(changelogDataService),

  // Loot operations
  setLootChannel: lootService.setLootChannel.bind(lootService),
  deleteLootChannel: lootService.deleteLootChannel.bind(lootService),
  getLootSettings: lootService.getLootSettings.bind(lootService),
  getLootSettingsForGuild:
    lootService.getLootSettingsForGuild.bind(lootService),
  getGuildIdByLootId: lootService.getGuildIdByLootId.bind(lootService),
  addLootFilter: lootService.addLootFilter.bind(lootService),
  toggleLootFilter: lootService.toggleLootFilter.bind(lootService),
  setLootFilterForMap: lootService.setLootFilterForMap.bind(lootService),
  clearLootFilters: lootService.clearLootFilters.bind(lootService),

  // Loot tooltip cache operations
  getLootTooltipCache:
    lootTooltipCacheService.getTooltipCache.bind(lootTooltipCacheService),
  saveLootTooltipCache:
    lootTooltipCacheService.saveTooltipCache.bind(lootTooltipCacheService),
  getLootTooltipStyles:
    lootTooltipStyleService.getTooltipStyles.bind(lootTooltipStyleService),
  saveLootTooltipStyles:
    lootTooltipStyleService.saveTooltipStyles.bind(lootTooltipStyleService),

  // Records operations
  initRecords: recordsService.initRecords.bind(recordsService),
  deleteRecords: recordsService.deleteRecords.bind(recordsService),
  pushRecords: recordsService.pushRecords.bind(recordsService),
  checkRecord: recordsService.checkRecord.bind(recordsService),

  // Settings operations
  getSettingsArray: settingsService.getSettingsArray.bind(settingsService),
  clearInactiveGuildsFromDb:
    settingsService.clearInactiveGuildsFromDb.bind(settingsService),
  clearGuildSettings: settingsService.clearGuildSettings.bind(settingsService),
  getGuildsCount: settingsService.getGuildsCount.bind(settingsService),
};
