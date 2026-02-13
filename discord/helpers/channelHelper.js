/**
 * @file Channel helper utilities
 * @description Utilities for working with Discord channels
 */

const { PermissionFlagsBits } = require("discord.js");

const {
  deleteChangelogChannelByChannelId,
  deleteLootChannelByChannelId,
} = require("../../db/database.js");
const logger = require("../../logger.js");

/**
 * Fetches channel from cache or API
 * @param {import('discord.js').Client} client - Discord client
 * @param {string} channelId - Channel ID
 * @returns {Promise<import('discord.js').Channel|null>}
 */
async function fetchChannel(client, channelId) {
  const cachedChannel = client.channels.cache.get(channelId);
  if (cachedChannel) {
    return cachedChannel;
  }

  try {
    return await client.channels.fetch(channelId);
  } catch (error) {
    logger.warn(`Channel with id ${channelId} not found: ${error.message}`);
    return null;
  }
}

/**
 * Checks whether bot can send notifications into channel
 * @param {import('discord.js').Client} client - Discord client
 * @param {import('discord.js').Channel} channel - Discord channel
 * @returns {string|null} Permission issue description or null
 */
function getSendPermissionIssue(client, channel) {
  if (!channel?.isTextBased?.()) {
    return "Channel is not text-based";
  }

  const permissions = channel.permissionsFor(client.user);
  if (!permissions) {
    return "Unable to resolve bot permissions in channel";
  }

  if (!permissions.has(PermissionFlagsBits.ViewChannel)) {
    return "Missing ViewChannel permission";
  }

  if (!permissions.has(PermissionFlagsBits.SendMessages)) {
    return "Missing SendMessages permission";
  }

  if (!permissions.has(PermissionFlagsBits.EmbedLinks)) {
    return "Missing EmbedLinks permission";
  }

  return null;
}

/**
 * Removes any notification settings that point to a restricted channel
 * @param {string} channelId - Channel ID
 * @returns {Promise<boolean>}
 */
async function cleanupRestrictedChannel(channelId) {
  try {
    await Promise.allSettled([
      deleteChangelogChannelByChannelId(channelId),
      deleteLootChannelByChannelId(channelId),
    ]);
  } catch (error) {
    logger.error(
      `Failed to cleanup restricted channel settings for ${channelId}: ${error.message}`,
    );
  }
}

/**
 * Sends embed to multiple channels
 * @param {import('discord.js').Client} client - Discord client
 * @param {Array<{channel_id: string}>} settings - Channel settings
 * @param {import('discord.js').EmbedBuilder|Array<import('discord.js').EmbedBuilder>} embeds - Embed(s) to send
 * @param {Array<import('discord.js').AttachmentBuilder>} [files] - Optional files to attach
 * @returns {Promise<boolean>} True when at least one message was sent
 */
async function sendToChannels(client, settings, embeds, files = []) {
  if (!settings || settings.length === 0) {
    logger.warn("No channel settings provided");
    return false;
  }

  logger.debug(`Sending message to ${settings.length} channels`);

  const embedArray = Array.isArray(embeds) ? embeds : [embeds];
  const fileArray = Array.isArray(files) ? files.filter(Boolean) : [];
  let successCount = 0;
  let failCount = 0;

  for (const entry of settings) {
    try {
      const channel = await fetchChannel(client, entry.channel_id);

      if (!channel) {
        await cleanupRestrictedChannel(entry.channel_id);
        throw new Error(`Can't get channel with id: ${entry.channel_id}`);
      }

      const permissionIssue = getSendPermissionIssue(client, channel);
      if (permissionIssue) {
        logger.warn(
          `Can't send message to channel ${entry.channel_id}: ${permissionIssue}. Removing channel from settings.`,
        );
        await cleanupRestrictedChannel(entry.channel_id);
        failCount++;
        continue;
      }

      await channel.send({ embeds: embedArray, files: fileArray });
      successCount++;
      logger.debug(`Successfully sent message to channel ${entry.channel_id}`);
    } catch (error) {
      failCount++;
      logger.error(
        `Failed to send message to channel ${entry.channel_id}: ${error.message}`,
      );
      logger.warn(`Can't send message to channel ${entry.channel_id}`);
    }
  }

  logger.debug(
    `Message delivery complete: ${successCount} success, ${failCount} failed`,
  );

  return successCount > 0;
}

/**
 * Sends message to a single channel
 * @param {import('discord.js').Client} client - Discord client
 * @param {string} channelId - Channel ID
 * @param {import('discord.js').EmbedBuilder|Array<import('discord.js').EmbedBuilder>} embeds - Embed(s) to send
 * @param {Array<import('discord.js').AttachmentBuilder>} [files] - Optional files to attach
 * @returns {Promise<boolean>} True when message was sent
 */
async function sendToChannel(client, channelId, embeds, files = []) {
  try {
    logger.debug(`Sending message to channel ${channelId}`);

    const channel = await fetchChannel(client, channelId);

    if (!channel) {
      await cleanupRestrictedChannel(channelId);
      throw new Error(`Can't get channel with id: ${channelId}`);
    }

    const permissionIssue = getSendPermissionIssue(client, channel);
    if (permissionIssue) {
      logger.warn(
        `Can't send message to channel ${channelId}: ${permissionIssue}. Removing channel from settings.`,
      );
      await cleanupRestrictedChannel(channelId);
      return false;
    }

    const embedArray = Array.isArray(embeds) ? embeds : [embeds];
    const fileArray = Array.isArray(files) ? files.filter(Boolean) : [];
    await channel.send({ embeds: embedArray, files: fileArray });

    logger.debug(`Successfully sent message to channel ${channelId}`);
    return true;
  } catch (error) {
    logger.error(
      `Failed to send message to channel ${channelId}: ${error.message}`,
    );
    logger.warn(`Can't send message to channel ${channelId}`);
    return false;
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
