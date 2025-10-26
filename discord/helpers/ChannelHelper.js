/**
 * @file Channel helper utilities
 * @description Utilities for working with Discord channels
 */

const logger = require("../../logger.js");

/**
 * Sends embed to multiple channels
 * @param {import('discord.js').Client} client - Discord client
 * @param {Array<{channel_id: string}>} settings - Channel settings
 * @param {import('discord.js').EmbedBuilder|Array<import('discord.js').EmbedBuilder>} embeds - Embed(s) to send
 * @returns {Promise<void>}
 */
async function sendToChannels(client, settings, embeds) {
  if (!settings || settings.length === 0) {
    logger.warn("No channel settings provided");
    return;
  }

  const embedArray = Array.isArray(embeds) ? embeds : [embeds];

  for (const entry of settings) {
    try {
      const channel = client.channels.cache.get(entry.channel_id);

      if (!channel) {
        throw new Error(`Can't get channel with id: ${entry.channel_id}`);
      }

      await channel.send({ embeds: embedArray });
    } catch (error) {
      logger.error(error);
      logger.warn(`Can't send message to channel ${entry.channel_id}`);
    }
  }
}

/**
 * Sends message to a single channel
 * @param {import('discord.js').Client} client - Discord client
 * @param {string} channelId - Channel ID
 * @param {import('discord.js').EmbedBuilder|Array<import('discord.js').EmbedBuilder>} embeds - Embed(s) to send
 * @returns {Promise<void>}
 */
async function sendToChannel(client, channelId, embeds) {
  try {
    const channel = client.channels.cache.get(channelId);

    if (!channel) {
      throw new Error(`Can't get channel with id: ${channelId}`);
    }

    const embedArray = Array.isArray(embeds) ? embeds : [embeds];
    await channel.send({ embeds: embedArray });
  } catch (error) {
    logger.error(error);
    logger.warn(`Can't send message to channel ${channelId}`);
  }
}

/**
 * Gets channel by ID with error handling
 * @param {import('discord.js').Client} client - Discord client
 * @param {string} channelId - Channel ID
 * @returns {import('discord.js').Channel|null}
 */
function getChannel(client, channelId) {
  try {
    const channel = client.channels.cache.get(channelId);

    if (!channel) {
      logger.warn(`Channel with id ${channelId} not found`);
      return null;
    }

    return channel;
  } catch (error) {
    logger.error(`Error getting channel ${channelId}: ${error.message}`);
    return null;
  }
}

module.exports = {
  sendToChannels,
  sendToChannel,
  getChannel,
};
