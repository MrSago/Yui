const logger = require("../../logger.js");

const BaseRepository = require("./BaseRepository.js");
const { ChangelogData } = require("../models/index.js");

/**
 * ChangelogData Repository
 * Handles all database operations for changelog data
 */
class ChangelogDataRepository extends BaseRepository {
  constructor() {
    super(ChangelogData);
  }

  /**
   * Get changelog data
   * @returns {Promise<any>}
   */
  async getData() {
    try {
      const data = await this.findAll();
      return data.length > 0 ? data[0].data : null;
    } catch (error) {
      logger.error(`Error getting changelog data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save changelog data (replaces existing)
   * @param {any} data - Data to save
   * @returns {Promise<any>}
   */
  async saveData(data) {
    try {
      await ChangelogData.deleteMany({});
      return await this.create({ data });
    } catch (error) {
      logger.error(`Error saving changelog data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Append to existing changelog data
   * @param {any} newData - New data to append
   * @returns {Promise<any>}
   */
  async appendData(newData) {
    try {
      const existing = await this.findAll();
      if (existing.length === 0) {
        return await this.create({ data: newData });
      }

      const currentData = existing[0].data;

      let mergedData;
      if (Array.isArray(currentData)) {
        mergedData = Array.isArray(newData)
          ? [...currentData, ...newData]
          : [...currentData, newData];
      } else {
        mergedData = { ...currentData, ...newData };
      }

      return await this.updateById(existing[0]._id, { data: mergedData });
    } catch (error) {
      logger.error(`Error appending changelog data: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ChangelogDataRepository;
