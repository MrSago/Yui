/**
 * @file Changelog tracking module
 * @description Monitors and announces Sirus.su changelog updates
 */

const logger = require("../logger.js");
const db = require("../db/db.js");
const sirusApi = require("../api/sirusApi.js");
const config = require("../config").changelog;

const { EmbedBuilder } = require("discord.js");

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

  const embedMessage = new EmbedBuilder()
    .setColor(config.embed.color)
    .setAuthor({
      name: config.embed.authorName,
      iconURL: config.embed.authorIconUrl,
      url: config.embed.authorUrl,
    })
    .setTitle(config.embed.title)
    .setURL(sirusApi.getChangelogUrl())
    .setFooter({
      text: config.embed.footerText,
      iconURL: config.embed.footerIconUrl,
    });

  let message = "";
  for (let i = 0; i < cnt; ++i) {
    // Embedded message can have maximum of 2**12 (4096) characters
    if (message.length + data[i].message.length + 2 >= 4096) {
      embedMessage.setDescription(message);
      await sendChangeLog(embedMessage);
      message = "";
    }
    message += `${data[i].message}\n\n`;
  }
  if (message.length) {
    embedMessage.setDescription(message);
    await sendChangeLog(embedMessage);
  }
}

/**
 * Parses changelog data and counts new entries
 * @param {Array<Object>} data - Changelog data
 * @param {Array<string>} logs - Previously logged message IDs
 * @returns {number} Number of new changelog entries
 */
function parseData(data, logs) {
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
 * Sends changelog embed to configured Discord channels
 * @param {import('discord.js').EmbedBuilder} embedMessage - Embed message to send
 */
async function sendChangeLog(embedMessage) {
  const settings = await db.getChangelogSettings();
  if (!settings) {
    logger.warn("Can't load changelog settings from DB");
    return;
  }

  for (const entry of settings) {
    try {
      const channel = client.channels.cache.get(entry.channel_id);
      if (!channel) {
        throw new Error(`Can't get channel with id: ${entry.channel_id}`);
      }

      channel
        .send({ embeds: [embedMessage] })
        .catch((err) => logger.error(err));
    } catch (error) {
      logger.error(error);
      logger.warn(`Can't send message to channel ${entry.channel_id}`);
    }
  }
}

module.exports = {
  init: init,
};
