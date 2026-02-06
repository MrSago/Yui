const logger = require("../../logger.js");
const { lootTooltipStyleRepository } = require("../repositories/index.js");

class LootTooltipStyleService {
  async getTooltipStyles(realmId) {
    try {
      return await lootTooltipStyleRepository.findByRealm(realmId);
    } catch (error) {
      logger.error(
        `Error getting tooltip styles for realm ${realmId}: ${error.message}`,
      );
      return null;
    }
  }

  async saveTooltipStyles(realmId, styles = []) {
    try {
      return await lootTooltipStyleRepository.upsertStyles(realmId, styles);
    } catch (error) {
      logger.error(
        `Error saving tooltip styles for realm ${realmId}: ${error.message}`,
      );
      return null;
    }
  }
}

module.exports = LootTooltipStyleService;
