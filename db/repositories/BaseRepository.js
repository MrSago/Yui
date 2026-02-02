const logger = require("../../logger.js");

/**
 * Base Repository Class
 * Provides common database operations for all repositories
 */
class BaseRepository {
  /**
   * @param {import('mongoose').Model} model - Mongoose model
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * Find a document by ID
   * @param {string} id - Document ID
   * @returns {Promise<any>}
   */
  async findById(id) {
    try {
      return await this.model.findById(id);
    } catch (error) {
      logger.error(
        `Error finding ${this.model.modelName} by id: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Find one document by query
   * @param {Object} query - Search query
   * @returns {Promise<any>}
   */
  async findOne(query) {
    try {
      return await this.model.findOne(query);
    } catch (error) {
      logger.error(
        `Error finding one ${this.model.modelName}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Find all documents by query
   * @param {Object} query - Search query
   * @returns {Promise<Array>}
   */
  async findAll(query = {}) {
    try {
      return await this.model.find(query);
    } catch (error) {
      logger.error(
        `Error finding all ${this.model.modelName}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Create a new document
   * @param {Object} data - Document data
   * @returns {Promise<any>}
   */
  async create(data) {
    try {
      return await this.model.create(data);
    } catch (error) {
      logger.error(`Error creating ${this.model.modelName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update a document by ID
   * @param {string} id - Document ID
   * @param {Object} data - Update data
   * @returns {Promise<any>}
   */
  async updateById(id, data) {
    try {
      return await this.model.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });
    } catch (error) {
      logger.error(
        `Error updating ${this.model.modelName} by id: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Update one document by query
   * @param {Object} query - Search query
   * @param {Object} data - Update data
   * @returns {Promise<any>}
   */
  async updateOne(query, data) {
    try {
      return await this.model.findOneAndUpdate(query, data, {
        new: true,
        runValidators: true,
      });
    } catch (error) {
      logger.error(
        `Error updating one ${this.model.modelName}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Delete a document by ID
   * @param {string} id - Document ID
   * @returns {Promise<any>}
   */
  async deleteById(id) {
    try {
      return await this.model.findByIdAndDelete(id);
    } catch (error) {
      logger.error(
        `Error deleting ${this.model.modelName} by id: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Delete one document by query
   * @param {Object} query - Search query
   * @returns {Promise<any>}
   */
  async deleteOne(query) {
    try {
      return await this.model.findOneAndDelete(query);
    } catch (error) {
      logger.error(
        `Error deleting one ${this.model.modelName}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Count documents by query
   * @param {Object} query - Search query
   * @returns {Promise<number>}
   */
  async count(query = {}) {
    try {
      return await this.model.countDocuments(query);
    } catch (error) {
      logger.error(`Error counting ${this.model.modelName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if document exists
   * @param {Object} query - Search query
   * @returns {Promise<boolean>}
   */
  async exists(query) {
    try {
      const doc = await this.model.exists(query);
      return doc !== null;
    } catch (error) {
      logger.error(
        `Error checking if ${this.model.modelName} exists: ${error.message}`,
      );
      throw error;
    }
  }
}

module.exports = BaseRepository;
