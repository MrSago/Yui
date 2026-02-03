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

  normalizeEncounterList(encounters) {
    return Array.from(new Set(encounters)).sort((a, b) => a - b);
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
   * @param {Map<string, Array<number>>} newFilters - Map of mapId to array of encounter_id
   * @returns {Promise<any>}
   */
  async addLootFilter(id, newFilters) {
    try {
      const loot = await this.findById(id);
      if (!loot) {
        throw new Error(`Loot with id ${id} not found`);
      }

      if (!loot.filter) {
        loot.filter = new Map();
      }

      for (const [mapId, encounterIds] of Object.entries(newFilters)) {
        const existingEncounters = loot.filter.get(mapId) || [];
        const updatedEncounters = this.normalizeEncounterList([
          ...existingEncounters,
          ...encounterIds,
        ]);
        loot.filter.set(mapId, updatedEncounters);
      }
      await loot.save();
      return loot;
    } catch (error) {
      logger.error(`Error setting dungeon filter: ${error.message}`);
      throw error;
    }
  }

  /**
   * Toggle encounter filter for a dungeon
   * @param {string} id - Loot document ID
   * @param {string} mapId - Dungeon map ID
   * @param {number} encounterId - Encounter ID to toggle
   * @returns {Promise<any>}
   */
  async toggleLootFilter(id, mapId, encounterId) {
    try {
      const loot = await this.findById(id);
      if (!loot) {
        throw new Error(`Loot with id ${id} not found`);
      }

      if (!loot.filter) {
        loot.filter = new Map();
      }

      const existingEncounters = loot.filter.get(mapId) || [];
      const encounterSet = new Set(existingEncounters);

      if (existingEncounters.length === 0) {
        encounterSet.add(encounterId);
      } else if (encounterSet.has(encounterId)) {
        encounterSet.delete(encounterId);
      } else {
        encounterSet.add(encounterId);
      }

      if (encounterSet.size === 0) {
        loot.filter.delete(mapId);
      } else {
        loot.filter.set(
          mapId,
          this.normalizeEncounterList(Array.from(encounterSet)),
        );
      }

      await loot.save();
      return loot;
    } catch (error) {
      logger.error(`Error toggling dungeon filter: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set encounter filter list for a dungeon
   * @param {string} id - Loot document ID
   * @param {string} mapId - Dungeon map ID
   * @param {Array<number>|null} encounterIds - Encounter IDs or null to remove
   * @returns {Promise<any>}
   */
  async setLootFilterForMap(id, mapId, encounterIds) {
    try {
      const loot = await this.findById(id);
      if (!loot) {
        throw new Error(`Loot with id ${id} not found`);
      }

      if (!loot.filter) {
        loot.filter = new Map();
      }

      if (encounterIds === null) {
        loot.filter.delete(mapId);
      } else {
        loot.filter.set(mapId, this.normalizeEncounterList(encounterIds));
      }

      await loot.save();
      return loot;
    } catch (error) {
      logger.error(`Error setting dungeon filter map: ${error.message}`);
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
        filter: {},
      });
    } catch (error) {
      logger.error(`Error clearing filters: ${error.message}`);
      throw error;
    }
  }
}

module.exports = LootRepository;
