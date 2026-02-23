const logger = require("../../logger.js").child({
  module: "db/repositories/ChangelogRepository",
});

const BaseRepository = require("./BaseRepository.js");
const { Changelog } = require("../models/index.js");

/**
 * Changelog Repository
 * Handles all database operations for changelog configurations
 */
class ChangelogRepository extends BaseRepository {
  constructor() {
    super(Changelog);
  }

  /**
   * Find changelog by channel ID
   * @param {string} channelId - Discord channel ID
   * @returns {Promise<any>}
   */
  async findByChannelId(channelId) {
    try {
      return await this.findOne({ channel_id: channelId });
    } catch (error) {
      logger.error({ err: error }, "Error finding changelog by channel id:");
      throw error;
    }
  }

  /**
   * Create changelog with channel ID
   * @param {string} channelId - Discord channel ID
   * @returns {Promise<any>}
   */
  async createWithChannelId(channelId) {
    try {
      return await this.create({ channel_id: channelId });
    } catch (error) {
      logger.error({ err: error }, "Error creating changelog:");
      throw error;
    }
  }

  /**
   * Update changelog channel ID
   * @param {string} id - Changelog document ID
   * @param {string} channelId - New Discord channel ID
   * @returns {Promise<any>}
   */
  async updateChannelId(id, channelId) {
    try {
      return await this.updateById(id, { channel_id: channelId });
    } catch (error) {
      logger.error({ err: error }, "Error updating changelog channel id:");
      throw error;
    }
  }
}

module.exports = ChangelogRepository;
