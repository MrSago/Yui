const fs = require("fs");

const logger = require("../logger.js").child({ module: "utils/fileLoader" });

/**
 * Loads a JSON file
 * @param {string} filePath - Path to file
 * @param {string} description - Description of data being loaded (for logs)
 * @returns {Object|Array|null} Loaded data or null on error
 */
function loadJsonFile(filePath, description = "data") {
  logger.info({ description, file_path: filePath }, "Loading JSON file");

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    logger.info(
      { description, file_path: filePath },
      "JSON file loaded successfully",
    );
    return data;
  } catch (error) {
    logger.error(error);
    logger.warn(
      { file_path: filePath, description },
      "Failed to load JSON file",
    );
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
  description = "data",
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
  logger.info({ description, file_path: filePath }, "Saving JSON file");

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    logger.info(
      { description, file_path: filePath },
      "JSON file saved successfully",
    );
    return true;
  } catch (error) {
    logger.error(error);
    logger.warn(
      { description, file_path: filePath },
      "Failed to save JSON file",
    );
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
      logger.info({ dir_path: dirPath }, "Directory created");
    }
    return true;
  } catch (error) {
    logger.error(error);
    logger.warn({ dir_path: dirPath }, "Failed to create directory");
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
