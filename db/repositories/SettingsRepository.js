const logger = require("../../logger.js").child({
  module: "db/repositories/SettingsRepository",
});

const BaseRepository = require("./BaseRepository.js");
const { Settings } = require("../models/index.js");

/**
 * Settings Repository
 * Handles all database operations for guild settings
 */
class SettingsRepository extends BaseRepository {
  constructor() {
    super(Settings);
  }

  /**
   * Find settings by guild ID
   * @param {string} guildId - Discord guild ID
   * @returns {Promise<any>}
   */
  async findByGuildId(guildId) {
    try {
      return await this.findOne({ guild_id: guildId });
    } catch (error) {
      logger.error({ err: error }, "Error finding settings by guild id:");
      throw error;
    }
  }

  /**
   * Create or update guild settings
   * @param {string} guildId - Discord guild ID
   * @param {Object} data - Settings data
   * @returns {Promise<any>}
   */
  async upsertByGuildId(guildId, data) {
    try {
      return await Settings.findOneAndUpdate({ guild_id: guildId }, data, {
        new: true,
        upsert: true,
        runValidators: true,
      });
    } catch (error) {
      logger.error({ err: error }, "Error upserting settings by guild id:");
      throw error;
    }
  }

  /**
   * Delete settings by guild ID
   * @param {string} guildId - Discord guild ID
   * @returns {Promise<any>}
   */
  async deleteByGuildId(guildId) {
    try {
      return await this.deleteOne({ guild_id: guildId });
    } catch (error) {
      logger.error({ err: error }, "Error deleting settings by guild id:");
      throw error;
    }
  }

  /**
   * Get all guild IDs
   * @returns {Promise<Array<string>>}
   */
  async getAllGuildIds() {
    try {
      const settings = await this.findAll({}, { guild_id: 1 });
      return settings.map((s) => s.guild_id);
    } catch (error) {
      logger.error({ err: error }, "Error getting all guild ids:");
      throw error;
    }
  }

  /**
   * Populate settings with related documents
   * @param {string} guildId - Discord guild ID
   * @returns {Promise<any>}
   */
  async findByGuildIdPopulated(guildId) {
    try {
      return await Settings.findOne({ guild_id: guildId })
        .populate("changelog_id")
        .populate("loot_id");
    } catch (error) {
      logger.error(
        `Error finding populated settings by guild id: ${error.message}`,
      );
      throw error;
    }
  }
}

module.exports = SettingsRepository;
