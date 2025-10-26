const logger = require("../../logger.js");
const { settingsRepository } = require("../repositories/index.js");

/**
 * Settings Service
 * Business logic for settings operations
 */
class SettingsService {
  /**
   * Gets all settings as array
   * @returns {Promise<Array>}
   */
  async getSettingsArray() {
    try {
      return await settingsRepository.findAll();
    } catch (error) {
      logger.error(`Error getting settings array: ${error.message}`);
      return [];
    }
  }

  /**
   * Removes guilds from database that bot is no longer a member of
   * @param {import('discord.js').Client} client - Discord client instance
   * @returns {Promise<number>}
   */
  async clearInactiveGuildsFromDb(client) {
    try {
      const currentGuildIds = client.guilds.cache.map((guild) => guild.id);
      const allSettings = await settingsRepository.findAll();
      const storedGuildIds = allSettings.map((s) => s.guild_id);

      const removedGuildIds = storedGuildIds.filter(
        (guildId) => !currentGuildIds.includes(guildId)
      );

      for (const guildId of removedGuildIds) {
        await this.clearGuildSettings(guildId);
      }

      return removedGuildIds.length;
    } catch (error) {
      logger.error(`Error clearing inactive guilds: ${error.message}`);
      return 0;
    }
  }

  /**
   * Clears all settings for a guild
   * @param {string} guildId - Discord guild ID
   * @returns {Promise<void>}
   */
  async clearGuildSettings(guildId) {
    try {
      const ChangelogService = require("./ChangelogService.js");
      const LootService = require("./LootService.js");
      const RecordsService = require("./RecordsService.js");

      const changelogService = new ChangelogService();
      const lootService = new LootService();
      const recordsService = new RecordsService();

      await changelogService.deleteChangelogChannel(guildId);
      await lootService.deleteLootChannel(guildId);
      await recordsService.deleteRecords(guildId);
      await settingsRepository.deleteByGuildId(guildId);
    } catch (error) {
      logger.error(`Error clearing guild settings: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets total count of guilds
   * @returns {Promise<number>}
   */
  async getGuildsCount() {
    try {
      return await settingsRepository.count();
    } catch (error) {
      logger.error(`Error getting guilds count: ${error.message}`);
      return 0;
    }
  }
}

module.exports = SettingsService;
