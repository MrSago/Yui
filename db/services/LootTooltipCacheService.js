const logger = require("../../logger.js").child({ module: "db/services/LootTooltipCacheService" });
const { lootTooltipCacheRepository } = require("../repositories/index.js");

class LootTooltipCacheService {
  async getTooltipCache(itemEntry) {
    try {
      return await lootTooltipCacheRepository.findByItem(itemEntry);
    } catch (error) {
      logger.error(
        `Error getting tooltip cache for item ${itemEntry}: ${error.message}`,
      );
      return null;
    }
  }

  async saveTooltipCache(itemEntry, tooltipHtml) {
    try {
      return await lootTooltipCacheRepository.upsertTooltipCache(
        itemEntry,
        tooltipHtml,
      );
    } catch (error) {
      logger.error(
        `Error saving tooltip cache for item ${itemEntry}: ${error.message}`,
      );
      return null;
    }
  }

  async clearTooltipCache() {
    try {
      return await lootTooltipCacheRepository.clearTooltipCache();
    } catch (error) {
      logger.error({ err: error }, "Error clearing tooltip cache:");
      return null;
    }
  }
}

module.exports = LootTooltipCacheService;
