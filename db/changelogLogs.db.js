const logger = require("../logger.js");
const { ensureConnected, getCollection } = require("./connection.js");

/**
 * Gets changelog logs from database
 * @returns {Promise<Array<string>>} Array of changelog messages
 */
async function getChangelogLogs() {
  ensureConnected();
  try {
    const changelogLogs = getCollection("changelogLogs");
    const doc = await changelogLogs.findOne({ _id: "logs" });
    return doc ? doc.messages : [];
  } catch (error) {
    logger.error(`Error getting changelog logs: ${error.message}`);
    return [];
  }
}

/**
 * Saves changelog logs to database
 * @param {Array<string>} messages - Array of changelog messages
 * @returns {Promise<boolean>} true on success
 */
async function saveChangelogLogs(messages) {
  ensureConnected();
  try {
    const changelogLogs = getCollection("changelogLogs");
    await changelogLogs.updateOne(
      { _id: "logs" },
      { $set: { messages: messages, updatedAt: new Date() } },
      { upsert: true }
    );
    return true;
  } catch (error) {
    logger.error(`Error saving changelog logs: ${error.message}`);
    return false;
  }
}

/**
 * Appends new messages to changelog logs
 * @param {Array<string>} newMessages - Array of new messages to append
 * @returns {Promise<boolean>} true on success
 */
async function appendChangelogLogs(newMessages) {
  ensureConnected();
  try {
    const changelogLogs = getCollection("changelogLogs");
    await changelogLogs.updateOne(
      { _id: "logs" },
      {
        $push: { messages: { $each: newMessages } },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );
    return true;
  } catch (error) {
    logger.error(`Error appending changelog logs: ${error.message}`);
    return false;
  }
}

module.exports = {
  getChangelogLogs,
  saveChangelogLogs,
  appendChangelogLogs,
};
