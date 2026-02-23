const logger = require("../../logger.js").child({
  module: "db/services/RecordsService",
});
const { recordsRepository } = require("../repositories/index.js");

/**
 * Records Service
 * Business logic for records operations
 */
class RecordsService {
  /**
   * Initialize records for a guild
   * @param {string} guildId - Discord guild ID
   * @returns {Promise<boolean>} Returns true if records already existed, false if newly created
   */
  async initRecords(guildId) {
    try {
      const result = await recordsRepository.initializeForGuild(guildId);
      return !result.isNew;
    } catch (error) {
      logger.error({ err: error }, "Error initializing records:");
      throw error;
    }
  }

  /**
   * Delete records for a guild
   * @param {string} guildId - Discord guild ID
   * @returns {Promise<void>}
   */
  async deleteRecords(guildId) {
    try {
      await recordsRepository.deleteByGuildId(guildId);
    } catch (error) {
      logger.error({ err: error }, "Error deleting records:");
      throw error;
    }
  }

  /**
   * Add a record to guild's records
   * @param {string} guildId - Discord guild ID
   * @param {string} record - Record to add
   * @returns {Promise<void>}
   */
  async pushRecords(guildId, record) {
    try {
      await recordsRepository.addRecord(guildId, record);
    } catch (error) {
      logger.error({ err: error }, "Error pushing record:");
      throw error;
    }
  }

  /**
   * Check if record exists for guild
   * @param {string} guildId - Discord guild ID
   * @param {string} record - Record to check
   * @returns {Promise<boolean>}
   */
  async checkRecord(guildId, record) {
    try {
      return await recordsRepository.hasRecord(guildId, record);
    } catch (error) {
      logger.error({ err: error }, "Error checking record:");
      return false;
    }
  }
}

module.exports = RecordsService;
