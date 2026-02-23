const logger = require("../../logger.js").child({
  module: "db/services/ChangelogDataService",
});
const { changelogDataRepository } = require("../repositories/index.js");

/**
 * ChangelogData Service
 * Business logic for changelog data operations
 */
class ChangelogDataService {
  /**
   * Get changelog data
   * @returns {Promise<any>}
   */
  async getChangelogData() {
    try {
      return await changelogDataRepository.getData();
    } catch (error) {
      logger.error({ err: error }, "Error getting changelog data:");
      return null;
    }
  }

  /**
   * Save changelog data
   * @param {any} data - Data to save
   * @returns {Promise<void>}
   */
  async saveChangelogData(data) {
    try {
      await changelogDataRepository.saveData(data);
    } catch (error) {
      logger.error({ err: error }, "Error saving changelog data:");
      throw error;
    }
  }

  /**
   * Append to existing changelog data
   * @param {any} newData - New data to append
   * @returns {Promise<void>}
   */
  async appendChangelogData(newData) {
    try {
      await changelogDataRepository.appendData(newData);
    } catch (error) {
      logger.error({ err: error }, "Error appending changelog data:");
      throw error;
    }
  }
}

module.exports = ChangelogDataService;
