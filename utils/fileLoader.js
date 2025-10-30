const fs = require("fs");

const logger = require("../logger.js");

/**
 * Loads a JSON file
 * @param {string} filePath - Path to file
 * @param {string} description - Description of data being loaded (for logs)
 * @returns {Object|Array|null} Loaded data or null on error
 */
function loadJsonFile(filePath, description = "data") {
  logger.info(`Loading ${description} from ${filePath}`);

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    logger.info(`${description} successfully loaded from ${filePath}`);
    return data;
  } catch (error) {
    logger.error(error);
    logger.warn(`Can't load ${filePath}`);
    return null;
  }
}

/**
 * Loads a JSON file with default value fallback
 * @param {string} filePath - Path to file
 * @param {any} defaultValue - Default value to return on error
 * @param {string} description - Description of data being loaded
 * @returns {Object|Array} Loaded data or defaultValue
 */
function loadJsonFileWithDefault(
  filePath,
  defaultValue = {},
  description = "data"
) {
  const data = loadJsonFile(filePath, description);
  return data !== null ? data : defaultValue;
}

/**
 * Saves data to a JSON file
 * @param {string} filePath - Path to file
 * @param {any} data - Data to save
 * @param {string} description - Description of data being saved
 * @returns {boolean} true on success, false on error
 */
function saveJsonFile(filePath, data, description = "data") {
  logger.info(`Saving ${description} to ${filePath}`);

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    logger.info(`${description} successfully saved to ${filePath}`);
    return true;
  } catch (error) {
    logger.error(error);
    logger.warn(`Can't save ${description} to ${filePath}`);
    return false;
  }
}

/**
 * Checks if file exists
 * @param {string} filePath - Path to file
 * @returns {boolean} true if file exists
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Creates directory if it doesn't exist
 * @param {string} dirPath - Path to directory
 * @returns {boolean} true on success
 */
function ensureDirectoryExists(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info(`Directory created: ${dirPath}`);
    }
    return true;
  } catch (error) {
    logger.error(error);
    logger.warn(`Can't create directory: ${dirPath}`);
    return false;
  }
}

module.exports = {
  loadJsonFile,
  loadJsonFileWithDefault,
  saveJsonFile,
  fileExists,
  ensureDirectoryExists,
};
