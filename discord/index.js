/**
 * Discord Module
 * Provides builders and helpers for Discord interactions
 */

const BaseEmbedBuilder = require("./builders/BaseEmbedBuilder.js");
const ChangelogEmbedBuilder = require("./builders/ChangelogEmbedBuilder.js");
const LootEmbedBuilder = require("./builders/LootEmbedBuilder.js");
const ChannelHelper = require("./helpers/ChannelHelper.js");

module.exports = {
  // Builders
  BaseEmbedBuilder,
  ChangelogEmbedBuilder,
  LootEmbedBuilder,

  // Helpers
  ChannelHelper,
};
