/**
 * Discord Module
 * Provides Discord client, builders, helpers and utilities
 */

const { initializeClient } = require("./client.js");
const { fetchAll, fetchGuild } = require("./fetch.js");
const baseEmbedBuilder = require("./builders/baseEmbedBuilder.js");
const changelogEmbedBuilder = require("./builders/changelogEmbedBuilder.js");
const lootEmbedBuilder = require("./builders/lootEmbedBuilder.js");
const channelHelper = require("./helpers/channelHelper.js");
const { setVoiceStatus } = require("./helpers/discordUtils.js");

module.exports = {
  initializeClient,
  fetchAll,
  fetchGuild,
  ...baseEmbedBuilder,
  ...changelogEmbedBuilder,
  ...lootEmbedBuilder,
  ...channelHelper,
  setVoiceStatus,
};
