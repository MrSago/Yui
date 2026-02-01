const logger = require("../../logger.js");
const {
  settingsRepository,
  lootRepository,
} = require("../repositories/index.js");

/**
 * Loot Service
 * Business logic for loot operations
 */
class LootService {
  /**
   * Sets loot channel for a guild
   * @param {string} guildId - Discord guild ID
   * @param {string} channelId - Discord channel ID
   * @param {number} realmId - Realm ID
   * @param {number} guildSirusId - Guild Sirus ID
   * @returns {Promise<void>}
   */
  async setLootChannel(guildId, channelId, realmId, guildSirusId) {
    try {
      logger.info(
        `Setting loot channel for guild ${guildId}: channel=${channelId}, realm=${realmId}, sirus_id=${guildSirusId}`,
      );

      const settings = await settingsRepository.findByGuildId(guildId);

      if (!settings) {
        const loot = await lootRepository.createLoot(
          channelId,
          realmId,
          guildSirusId,
        );
        await settingsRepository.create({
          guild_id: guildId,
          loot_id: loot._id,
        });
        logger.info(`Created new loot settings for guild ${guildId}`);
        return;
      }

      if (!settings.loot_id) {
        const loot = await lootRepository.createLoot(
          channelId,
          realmId,
          guildSirusId,
        );
        await settingsRepository.upsertByGuildId(guildId, {
          loot_id: loot._id,
        });
        logger.info(
          `Updated loot settings for guild ${guildId} (no previous loot_id)`,
        );
        return;
      }

      await lootRepository.updateLoot(
        settings.loot_id,
        channelId,
        realmId,
        guildSirusId,
      );
      logger.info(`Updated existing loot settings for guild ${guildId}`);
    } catch (error) {
      logger.error(
        `Error setting loot channel for guild ${guildId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Deletes loot channel for a guild
   * @param {string} guildId - Discord guild ID
   * @returns {Promise<void>}
   */
  async deleteLootChannel(guildId) {
    try {
      logger.info(`Deleting loot channel for guild ${guildId}`);

      const settings = await settingsRepository.findByGuildId(guildId);
      if (!settings || !settings.loot_id) {
        logger.debug(`No loot settings found for guild ${guildId}`);
        return;
      }

      await lootRepository.deleteById(settings.loot_id);
      await settingsRepository.upsertByGuildId(guildId, {
        $unset: { loot_id: 1 },
      });
      logger.info(`Successfully deleted loot settings for guild ${guildId}`);
    } catch (error) {
      logger.error(
        `Error deleting loot channel for guild ${guildId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Gets all loot settings
   * @returns {Promise<Array|null>} Array of loot settings or null
   */
  async getLootSettings() {
    try {
      return await lootRepository.findAll();
    } catch (error) {
      logger.error(`Error getting loot settings: ${error.message}`);
      return null;
    }
  }

  /**
   * Gets guild ID by loot ID
   * @param {string} lootId - Loot document ID
   * @returns {Promise<string|null>} Guild ID or null
   */
  async getGuildIdByLootId(lootId) {
    try {
      const settings = await settingsRepository.findOne({ loot_id: lootId });
      return settings ? settings.guild_id : null;
    } catch (error) {
      logger.error(`Error getting guild ID by loot ID: ${error.message}`);
      return null;
    }
  }
}

module.exports = LootService;
