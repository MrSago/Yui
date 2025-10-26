/**
 * @file Changelog tracking module
 * @description Monitors and announces Sirus.su changelog updates
 */

const logger = require("../logger.js");
const db = require("../db/db.js");
const sirusApi = require("../api/sirusApi.js");
const config = require("../config").changelog;
const { ChangelogEmbedBuilder, ChannelHelper } = require("../discord");

const INTERVAL_UPDATE_MS = config.updateIntervalMs;

var client;

/**
 * Initializes changelog tracking
 * @param {import('discord.js').Client} discord - Discord client instance
 */
function init(discord) {
  client = discord;

  startUpdatingChangelog();
}

/**
 * Starts the changelog update loop
 */
async function startUpdatingChangelog() {
  logger.info("Updating changelog started");

  const data = await sirusApi.getChangelog();
  if (data) {
    sendData(data);
  }

  logger.info("Updating changelog ended");

  setTimeout(startUpdatingChangelog, INTERVAL_UPDATE_MS);
}

/**
 * Processes and sends changelog data
 * @param {Array<Object>} data - Changelog data from API
 */
async function sendData(data) {
  const logs = await loadLogs();
  const cnt = parseData(data, logs);
  if (!cnt) {
    return;
  }

  const newMessages = [];
  for (let i = cnt - 1; i >= 0; --i) {
    newMessages.push(data[i].message);
  }
  await saveLogs([...logs, ...newMessages]);

  const newChangelog = data.slice(0, cnt);
  const embeds = ChangelogEmbedBuilder.createChangelogEmbeds(newChangelog);

  await sendChangeLog(embeds);
}

/**
 * Parses changelog data and counts new entries
 * @param {Array<Object>} data - Changelog data
 * @param {Array<string>} logs - Previously logged message IDs
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
 * Loads changelog logs from the database
 * @returns {Promise<string[]>} Array of changelog message IDs
 */
async function loadLogs() {
  return await db.getChangelogLogs();
}

/**
 * Saves changelog logs to the database
 * @param {string[]} logs - Array of changelog message IDs to save
 * @returns {Promise<void>}
 */
async function saveLogs(logs) {
  await db.saveChangelogLogs(logs);
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

  await ChannelHelper.sendToChannels(client, settings, embeds);
}

module.exports = {
  init: init,
};
