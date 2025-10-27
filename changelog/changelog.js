/**
 * @file Changelog tracking module
 * @description Monitors and announces Sirus.su changelog updates
 */

const logger = require("../logger.js");
const db = require("../db/database.js");
const sirusApi = require("../api/sirusApi.js");
const config = require("../config").changelog;
const { createChangelogEmbeds, sendToChannels } = require("../discord");

const INTERVAL_UPDATE_MS = config.updateIntervalMs;

var client;

/**
 * Initializes changelog tracking
 * @param {import('discord.js').Client} discord - Discord client instance
 */
function init(discord) {
  client = discord;

  logger.info("Initializing changelog tracking module");
  logger.info("Changelog tracking module initialized successfully");

  startUpdatingChangelog();
}

/**
 * Starts the changelog update loop
 */
async function startUpdatingChangelog() {
  logger.info("Updating changelog started");

  try {
    const data = await sirusApi.getChangelog();
    if (data) {
      logger.debug(`Retrieved ${data.length} changelog entries from API`);
      await sendData(data);
    } else {
      logger.warn("Failed to retrieve changelog data from API");
    }
  } catch (error) {
    logger.error(`Error updating changelog: ${error.message}`);
    logger.error(error);
  }

  logger.info("Updating changelog ended");

  setTimeout(startUpdatingChangelog, INTERVAL_UPDATE_MS);
}

/**
 * Processes and sends changelog data
 * @param {Array<Object>} data - Changelog data from API
 */
async function sendData(data) {
  const logs = await db.getChangelogData();
  const cnt = parseData(data, logs);
  if (!cnt) {
    logger.debug("No new changelog entries found");
    return;
  }

  logger.info(`Found ${cnt} new changelog entries`);

  const newMessages = [];
  for (let i = cnt - 1; i >= 0; --i) {
    newMessages.push(data[i].message);
  }

  await db.appendChangelogData(newMessages);
  logger.debug(
    `Saved ${newMessages.length} new changelog messages to database`
  );

  const newChangelog = data.slice(0, cnt);
  const embeds = createChangelogEmbeds(newChangelog);

  await sendChangeLog(embeds);
}

/**
 * Parses changelog data and finds new entries
 * @param {Array<Object>} data - Changelog data from API
 * @param {string[]|null} logs - Existing changelog logs
 * @returns {number} Number of new changelog entries
 */
function parseData(data, logs) {
  if (!logs || logs.length === 0) {
    return data.length;
  }

  let cnt = 0;
  for (let i = 0; i < data.length; ++i) {
    if (data[i].message[data[i].message.length - 1] === ">") {
      data[i].message = data[i].message.slice(0, -6);
    }
    if (data[i].message === logs[logs.length - 1]) {
      break;
    }
    ++cnt;
  }
  return cnt;
}

/**
 * Sends changelog embeds to configured Discord channels
 * @param {Array<import('discord.js').EmbedBuilder>} embeds - Array of embed messages
 */
async function sendChangeLog(embeds) {
  const settings = await db.getChangelogSettings();
  if (!settings) {
    logger.warn("Can't load changelog settings from DB");
    return;
  }

  logger.debug(`Sending changelog to ${settings.length} configured channels`);

  await sendToChannels(client, settings, embeds);

  logger.info(`Changelog notifications sent to ${settings.length} channels`);
}

module.exports = {
  init: init,
};
