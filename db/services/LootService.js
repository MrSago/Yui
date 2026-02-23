const logger = require("../../logger.js").child({ module: "db/services/LootService" });
const {
  settingsRepository,
  lootRepository,
} = require("../repositories/index.js");
const {
  LootSettingsNotFoundError,
} = require("../../error/LootSettingsNotFoundError.js");

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
        logger.info({ guild_id: guildId }, "Created new loot settings for guild");
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
      await lootRepository.clearFilters(settings.loot_id);
      logger.info({ guild_id: guildId }, "Updated existing loot settings for guild");
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
      logger.info({ guild_id: guildId }, "Deleting loot channel for guild");

      const settings = await settingsRepository.findByGuildId(guildId);
      if (!settings || !settings.loot_id) {
        logger.debug({ guild_id: guildId }, "No loot settings found for guild");
        return;
      }

      await lootRepository.deleteById(settings.loot_id);
      await settingsRepository.upsertByGuildId(guildId, {
        $unset: { loot_id: 1 },
      });
      logger.info({ guild_id: guildId }, "Successfully deleted loot settings for guild");
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
      logger.error({ err: error }, "Error getting loot settings:");
      return null;
    }
  }


  /**
   * Deletes loot channel settings by channel ID
   * @param {string} channelId - Discord channel ID
   * @returns {Promise<void>}
   */
  async deleteLootChannelByChannelId(channelId) {
    try {
      const loot = await lootRepository.findByChannelId(channelId);
      if (!loot) {
        logger.debug(
          `No loot settings found for channel ${channelId}, skip cleanup`,
        );
        return;
      }

      const settings = await settingsRepository.findOne({ loot_id: loot._id });

      await lootRepository.deleteById(loot._id);

      if (settings?.guild_id) {
        await settingsRepository.upsertByGuildId(settings.guild_id, {
          $unset: { loot_id: 1 },
        });
      }

      logger.info(
        `Removed loot settings for channel ${channelId} due to delivery restrictions`,
      );
    } catch (error) {
      logger.error(
        `Error deleting loot settings by channel id ${channelId}: ${error.message}`,
      );
      throw error;
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
      logger.error({ err: error }, "Error getting guild ID by loot ID:");
      return null;
    }
  }

  /**
   * Sets dungeon filter for a guild
   * @param {string} guildId - Discord guild ID
   * @param {Map<string, Array<number>>} filters - Map of mapId to array of encounter_id
   * @returns {Promise<any>}
   */
  async addLootFilter(guildId, filters) {
    try {
      logger.info(
        `Setting dungeon filter for guild ${guildId}: ${JSON.stringify(
          filters,
        )}`,
      );

      const settings = await settingsRepository.findByGuildId(guildId);
      if (!settings || !settings.loot_id) {
        throw new LootSettingsNotFoundError(guildId);
      }

      const updatedLootSettings = await lootRepository.addLootFilter(
        settings.loot_id,
        filters,
      );
      logger.info({ guild_id: guildId }, "Successfully set dungeon filter for guild");
      return updatedLootSettings;
    } catch (error) {
      logger.error(
        `Error setting dungeon filter for guild ${guildId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Gets loot settings for a guild
   * @param {string} guildId - Discord guild ID
   * @returns {Promise<any>}
   */
  async getLootSettingsForGuild(guildId) {
    try {
      const settings =
        await settingsRepository.findByGuildIdPopulated(guildId);
      if (!settings || !settings.loot_id) {
        throw new LootSettingsNotFoundError(guildId);
      }
      return settings.loot_id;
    } catch (error) {
      logger.error(
        `Error getting loot settings for guild ${guildId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Toggles encounter filter for a dungeon
   * @param {string} guildId - Discord guild ID
   * @param {string} mapId - Dungeon map ID
   * @param {number} encounterId - Encounter ID to toggle
   * @returns {Promise<any>}
   */
  async toggleLootFilter(guildId, mapId, encounterId) {
    try {
      const settings = await settingsRepository.findByGuildId(guildId);
      if (!settings || !settings.loot_id) {
        throw new LootSettingsNotFoundError(guildId);
      }

      return await lootRepository.toggleLootFilter(
        settings.loot_id,
        mapId,
        encounterId,
      );
    } catch (error) {
      logger.error(
        `Error toggling dungeon filter for guild ${guildId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Sets encounter filter list for a dungeon
   * @param {string} guildId - Discord guild ID
   * @param {string} mapId - Dungeon map ID
   * @param {Array<number>|null} encounterIds - Encounter IDs or null to remove
   * @returns {Promise<any>}
   */
  async setLootFilterForMap(guildId, mapId, encounterIds) {
    try {
      const settings = await settingsRepository.findByGuildId(guildId);
      if (!settings || !settings.loot_id) {
        throw new LootSettingsNotFoundError(guildId);
      }

      return await lootRepository.setLootFilterForMap(
        settings.loot_id,
        mapId,
        encounterIds,
      );
    } catch (error) {
      logger.error(
        `Error setting dungeon filter for guild ${guildId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Clears all filters for a guild
   * @param {string} guildId - Discord guild ID
   * @returns {Promise<void>}
   */
  async clearLootFilters(guildId) {
    try {
      logger.info({ guild_id: guildId }, "Clearing filters for guild");

      const settings = await settingsRepository.findByGuildId(guildId);
      if (!settings || !settings.loot_id) {
        throw new LootSettingsNotFoundError(guildId);
      }

      await lootRepository.clearFilters(settings.loot_id);
      logger.info({ guild_id: guildId }, "Successfully cleared filters for guild");
    } catch (error) {
      logger.error(
        `Error clearing filters for guild ${guildId}: ${error.message}`,
      );
      throw error;
    }
  }
}

module.exports = LootService;
