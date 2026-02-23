const logger = require("../../logger.js").child({
  module: "db/services/ChangelogService",
});
const {
  settingsRepository,
  changelogRepository,
} = require("../repositories/index.js");

/**
 * Changelog Service
 * Business logic for changelog operations
 */
class ChangelogService {
  /**
   * Sets changelog channel for a guild
   * @param {string} guildId - Discord guild ID
   * @param {string} channelId - Discord channel ID
   * @returns {Promise<void>}
   */
  async setChangelogChannel(guildId, channelId) {
    try {
      logger.info(
        `Setting changelog channel for guild ${guildId}: channel=${channelId}`,
      );

      const settings = await settingsRepository.findByGuildId(guildId);

      if (!settings) {
        const changelog =
          await changelogRepository.createWithChannelId(channelId);
        await settingsRepository.create({
          guild_id: guildId,
          changelog_id: changelog._id,
        });
        logger.info(
          { guild_id: guildId },
          "Created new changelog settings for guild",
        );
        return;
      }

      if (!settings.changelog_id) {
        const changelog =
          await changelogRepository.createWithChannelId(channelId);
        await settingsRepository.upsertByGuildId(guildId, {
          changelog_id: changelog._id,
        });
        logger.info(
          `Updated changelog settings for guild ${guildId} (no previous changelog_id)`,
        );
        return;
      }

      await changelogRepository.updateChannelId(
        settings.changelog_id,
        channelId,
      );
      logger.info(
        { guild_id: guildId },
        "Updated existing changelog settings for guild",
      );
    } catch (error) {
      logger.error(
        `Error setting changelog channel for guild ${guildId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Deletes changelog channel for a guild
   * @param {string} guildId - Discord guild ID
   * @returns {Promise<void>}
   */
  async deleteChangelogChannel(guildId) {
    try {
      logger.info(
        { guild_id: guildId },
        "Deleting changelog channel for guild",
      );

      const settings = await settingsRepository.findByGuildId(guildId);
      if (!settings || !settings.changelog_id) {
        logger.debug(
          { guild_id: guildId },
          "No changelog settings found for guild",
        );
        return;
      }

      await changelogRepository.deleteById(settings.changelog_id);
      await settingsRepository.upsertByGuildId(guildId, {
        $unset: { changelog_id: 1 },
      });
      logger.info(
        `Successfully deleted changelog settings for guild ${guildId}`,
      );
    } catch (error) {
      logger.error(
        `Error deleting changelog channel for guild ${guildId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Deletes changelog channel settings by channel ID
   * @param {string} channelId - Discord channel ID
   * @returns {Promise<void>}
   */
  async deleteChangelogChannelByChannelId(channelId) {
    try {
      const changelog = await changelogRepository.findByChannelId(channelId);
      if (!changelog) {
        logger.debug(
          `No changelog settings found for channel ${channelId}, skip cleanup`,
        );
        return;
      }

      const settings = await settingsRepository.findOne({
        changelog_id: changelog._id,
      });

      await changelogRepository.deleteById(changelog._id);

      if (settings?.guild_id) {
        await settingsRepository.upsertByGuildId(settings.guild_id, {
          $unset: { changelog_id: 1 },
        });
      }

      logger.info(
        `Removed changelog settings for channel ${channelId} due to delivery restrictions`,
      );
    } catch (error) {
      logger.error(
        `Error deleting changelog settings by channel id ${channelId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Gets all changelog settings
   * @returns {Promise<Array|null>} Array of changelog settings or null
   */
  async getChangelogSettings() {
    try {
      return await changelogRepository.findAll();
    } catch (error) {
      logger.error({ err: error }, "Error getting changelog settings:");
      return null;
    }
  }
}

module.exports = ChangelogService;
