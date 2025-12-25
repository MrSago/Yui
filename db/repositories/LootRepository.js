const logger = require("../../logger.js");

const BaseRepository = require("./BaseRepository.js");
const { Loot } = require("../models/index.js");

/**
 * Loot Repository
 * Handles all database operations for loot configurations
 */
class LootRepository extends BaseRepository {
  constructor() {
    super(Loot);
  }

  /**
   * Find loot by channel ID
   * @param {string} channelId - Discord channel ID
   * @returns {Promise<any>}
   */
  async findByChannelId(channelId) {
    try {
      return await this.findOne({ channel_id: channelId });
    } catch (error) {
      logger.error(`Error finding loot by channel id: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create loot configuration
   * @param {string} channelId - Discord channel ID
   * @param {number} realmId - Realm ID
   * @param {number} guildSirusId - Guild Sirus ID
   * @returns {Promise<any>}
   */
  async createLoot(channelId, realmId, guildSirusId) {
    try {
      return await this.create({
        channel_id: channelId,
        realm_id: realmId,
        guild_sirus_id: guildSirusId,
      });
    } catch (error) {
      logger.error(`Error creating loot: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update loot configuration
   * @param {string} id - Loot document ID
   * @param {string} channelId - Discord channel ID
   * @param {number} realmId - Realm ID
   * @param {number} guildSirusId - Guild Sirus ID
   * @returns {Promise<any>}
   */
  async updateLoot(id, channelId, realmId, guildSirusId) {
    try {
      return await this.updateById(id, {
        channel_id: channelId,
        realm_id: realmId,
        guild_sirus_id: guildSirusId,
      });
    } catch (error) {
      logger.error(`Error updating loot: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set dungeon filter for loot configuration
   * @param {string} id - Loot document ID
   * @param {Array<number>} dungeonIds - Array of dungeon IDs
   * @returns {Promise<any>}
   */
  async setDungeonFilter(id, dungeonIds) {
    try {
      return await this.updateById(id, {
        dungeon_filter: dungeonIds,
      });
    } catch (error) {
      logger.error(`Error setting dungeon filter: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set boss filter for loot configuration
   * @param {string} id - Loot document ID
   * @param {Array<number>} bossIds - Array of boss IDs
   * @returns {Promise<any>}
   */
  async setBossFilter(id, bossIds) {
    try {
      return await this.updateById(id, {
        boss_filter: bossIds,
      });
    } catch (error) {
      logger.error(`Error setting boss filter: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clear filters for loot configuration
   * @param {string} id - Loot document ID
   * @returns {Promise<any>}
   */
  async clearFilters(id) {
    try {
      return await this.updateById(id, {
        dungeon_filter: [],
        boss_filter: [],
      });
    } catch (error) {
      logger.error(`Error clearing filters: ${error.message}`);
      throw error;
    }
  }
}

module.exports = LootRepository;
