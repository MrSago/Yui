/**
 * @file Discord utility functions
 * @description Provides utility functions for Discord API operations
 */

const config = require("../environment.js");
const { REST } = require("discord.js");

/**
 * Sets voice status for a Discord channel
 * @param {string} channel_id - Discord channel ID
 * @param {string} status - Status text to set
 * @returns {Promise<void>}
 */
async function setVoiceStatus(channel_id, status) {
  const rest = new REST({ version: "10" }).setToken(config.discord.token);
  payload = { status: status };
  await rest.put(`/channels/${channel_id}/voice-status`, {
    body: payload,
  });
}

module.exports = {
  setVoiceStatus,
};
