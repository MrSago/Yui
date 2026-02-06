const logger = require("../../logger.js");
const { lootTooltipCacheRepository } = require("../repositories/index.js");

class LootTooltipCacheService {
  async getTooltipCache(itemEntry, realmId) {
    try {
      return await lootTooltipCacheRepository.findByItemAndRealm(itemEntry, realmId);
    } catch (error) {
      logger.error(
        `Error getting tooltip cache for item ${itemEntry} realm ${realmId}: ${error.message}`,
      );
      return null;
    }
  }

  async saveTooltipCache(itemEntry, realmId, tooltipHtml, styles = []) {
    try {
      return await lootTooltipCacheRepository.upsertTooltipCache(
        itemEntry,
        realmId,
        tooltipHtml,
        styles,
      );
    } catch (error) {
      logger.error(
        `Error saving tooltip cache for item ${itemEntry} realm ${realmId}: ${error.message}`,
      );
      return null;
    }
  }
}

module.exports = LootTooltipCacheService;
