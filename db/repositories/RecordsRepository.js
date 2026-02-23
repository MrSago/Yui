const logger = require("../../logger.js").child({ module: "db/repositories/RecordsRepository" });

const BaseRepository = require("./BaseRepository.js");
const { Records } = require("../models/index.js");

/**
 * Records Repository
 * Handles all database operations for guild records
 */
class RecordsRepository extends BaseRepository {
  constructor() {
    super(Records);
  }

  /**
   * Find records by guild ID
   * @param {string} guildId - Discord guild ID
   * @returns {Promise<any>}
   */
  async findByGuildId(guildId) {
    try {
      return await this.findOne({ guild_id: guildId });
    } catch (error) {
      logger.error({ err: error }, "Error finding records by guild id:");
      throw error;
    }
  }

  /**
   * Initialize records for a guild
   * @param {string} guildId - Discord guild ID
   * @returns {Promise<{document: any, isNew: boolean}>} Returns document and whether it was newly created
   */
  async initializeForGuild(guildId) {
    try {
      const existing = await this.findByGuildId(guildId);
      if (existing) {
        return { document: existing, isNew: false };
      }
      const newDoc = await this.create({ guild_id: guildId, records: [] });
      return { document: newDoc, isNew: true };
    } catch (error) {
      logger.error({ err: error }, "Error initializing records:");
      throw error;
    }
  }

  /**
   * Add a record to guild's records
   * @param {string} guildId - Discord guild ID
   * @param {string} record - Record to add
   * @returns {Promise<any>}
   */
  async addRecord(guildId, record) {
    try {
      return await Records.findOneAndUpdate(
        { guild_id: guildId },
        { $addToSet: { records: record } },
        { new: true, upsert: true, runValidators: true },
      );
    } catch (error) {
      logger.error({ err: error }, "Error adding record:");
      throw error;
    }
  }

  /**
   * Check if record exists for guild
   * @param {string} guildId - Discord guild ID
   * @param {string} record - Record to check
   * @returns {Promise<boolean>}
   */
  async hasRecord(guildId, record) {
    try {
      const result = await Records.findOne({
        guild_id: guildId,
        records: record,
      });
      return result !== null;
    } catch (error) {
      logger.error({ err: error }, "Error checking record:");
      throw error;
    }
  }

  /**
   * Delete records by guild ID
   * @param {string} guildId - Discord guild ID
   * @returns {Promise<any>}
   */
  async deleteByGuildId(guildId) {
    try {
      return await this.deleteOne({ guild_id: guildId });
    } catch (error) {
      logger.error({ err: error }, "Error deleting records by guild id:");
      throw error;
    }
  }
}

module.exports = RecordsRepository;
