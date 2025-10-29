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

  logger.debug(`Sending message to ${settings.length} channels`);

  const embedArray = Array.isArray(embeds) ? embeds : [embeds];
  let successCount = 0;
  let failCount = 0;

  for (const entry of settings) {
    try {
      const channel = client.channels.cache.get(entry.channel_id);

      if (!channel) {
        throw new Error(`Can't get channel with id: ${entry.channel_id}`);
      }

      await channel.send({ embeds: embedArray });
      successCount++;
      logger.debug(`Successfully sent message to channel ${entry.channel_id}`);
    } catch (error) {
      failCount++;
      logger.error(
        `Failed to send message to channel ${entry.channel_id}: ${error.message}`
      );
      logger.warn(`Can't send message to channel ${entry.channel_id}`);
    }
  }

  logger.debug(
    `Message delivery complete: ${successCount} success, ${failCount} failed`
  );
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
    logger.debug(`Sending message to channel ${channelId}`);

    const channel = client.channels.cache.get(channelId);

    if (!channel) {
      throw new Error(`Can't get channel with id: ${channelId}`);
    }

    const embedArray = Array.isArray(embeds) ? embeds : [embeds];
    await channel.send({ embeds: embedArray });

    logger.debug(`Successfully sent message to channel ${channelId}`);
  } catch (error) {
    logger.error(
      `Failed to send message to channel ${channelId}: ${error.message}`
    );
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
