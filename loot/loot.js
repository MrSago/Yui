/**
 * @file Loot tracking module
 * @description Monitors and announces boss kills and loot information
 * @note Original code was taken from: https://github.com/JustJacob95/sirus_loot_discord_bot
 */

const { ActivityType, AttachmentBuilder } = require("discord.js");

const { loot: config } = require("../config/index.js");
const { app } = require("../environment.js");
const db = require("../db/database.js");
const {
  createCompleteBossKillEmbed,
  sendToChannel,
} = require("../discord/index.js");
const logger = require("../logger.js");
const sirusApi = require("../api/sirusApi.js");
const {
  createLootScreenshotBuffer,
  closeLootScreenshotBrowser,
} = require("./lootScreenshot.js");
const {
  parseDpsPlayers,
  parseHealPlayers,
  loadJsonFileWithDefault,
} = require("../utils/index.js");

const LOOT_PATH = config.dataPath;
const BLACKLIST_FILE = `${LOOT_PATH}/${config.files.blacklist}`;

const INTERVAL_UPDATE_MS = config.updateIntervalMs;

var client;
var blacklist = [];

/**
 * Initializes loot tracking
 * @param {import('discord.js').Client} discord - Discord client instance
 */
function init(discord) {
  client = discord;

  logger.info("Initializing loot tracking module");

  blacklist = loadJsonFileWithDefault(BLACKLIST_FILE, [], "loot blacklist");
  logger.debug(`Loaded ${blacklist.length} blacklist entries`);

  logger.info("Loot tracking module initialized successfully");
  startRefreshingLoot();
}

/**
 * Starts the loot refresh loop
 */
async function startRefreshingLoot() {
  logger.info("Refreshing loot started");

  client.user.setPresence({
    activities: [
      {
        name: config.activity.processingStatus.name,
        type: ActivityType[config.activity.processingStatus.type],
      },
    ],
    status: config.activity.processingStatus.status,
  });

  try {
    const settings = await db.getLootSettings();
    if (!settings) {
      logger.warn("Can't load loot settings from DB");
      return;
    }

    logger.debug(`Processing ${settings.length} loot settings entries`);

    const guild_id_promises = settings.map((entry) =>
      db.getGuildIdByLootId(entry._id).then((guild_id) => ({ entry, guild_id })),
    );

    const guild_entries = await Promise.all(guild_id_promises);

    const entry_promises = guild_entries
      .filter(({ guild_id, entry }) => {
        if (!guild_id) {
          logger.warn(`Guild ID not found for loot entry ${entry._id}`);
          return false;
        }
        return true;
      })
      .map(({ entry, guild_id }) => entryProcess(entry, guild_id));

    const results = await Promise.allSettled(entry_promises);
    const successful = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      logger.warn(
        `${failed.length} loot entries failed to process, ${successful.length} succeeded`,
      );
    }
    logger.debug(`Processed ${results.length} loot entries`);
  } finally {
    await closeLootScreenshotBrowser();

    const activity =
      app.nodeEnv === "development"
        ? config.activity.devStatus
        : config.activity.idleStatus;

    client.user.setPresence({
      activities: [
        {
          name: activity.name,
          type: ActivityType[activity.type],
        },
      ],
      status: activity.status,
    });
    logger.info("Refreshing loot ended");

    setTimeout(startRefreshingLoot, INTERVAL_UPDATE_MS);
  }
}


/**
 * Checks if loot settings are still configured for guild/channel
 * @param {string} guild_id - Discord guild ID
 * @param {string} channel_id - Discord channel ID
 * @returns {Promise<boolean>}
 */
async function hasActiveLootSettings(guild_id, channel_id) {
  try {
    const settings = await db.getLootSettingsForGuild(guild_id);
    return settings?.channel_id === channel_id;
  } catch (error) {
    logger.info(
      `Loot settings are no longer active for guild ${guild_id}, interrupting processing`,
    );
    return false;
  }
}

/**
 * Processes a single loot entry for a guild
 * Checks for new boss kill records and sends notifications to Discord
 * @param {Object} entry - Loot settings entry from database
 * @param {string} guild_id - Discord guild ID
 * @returns {Promise<void>}
 */
async function entryProcess(entry, guild_id) {
  logger.debug(
    `Processing loot for guild ${guild_id}, realm ${entry.realm_id}, sirus_id ${entry.guild_sirus_id}`,
  );

  const bossKillData = await sirusApi.getLatestBossKills(
    entry.realm_id,
    entry.guild_sirus_id,
  );

  if (!bossKillData) {
    logger.warn(
      `Can't get loot from realm ${sirusApi.getRealmNameById(
        entry.realm_id,
      )} with guild sirus id ${entry.guild_sirus_id}`,
    );
    return;
  }

  let records = bossKillData.data ?? bossKillData.records ?? [];

  logger.debug(
    `Retrieved ${records.length} boss kill records for guild ${guild_id}`,
  );

  logger.debug(`Entry filters: ${JSON.stringify(entry.filter)}`);

  if (entry.filter && entry.filter.size > 0) {
    logger.debug(`Applying filters for guild ${guild_id}`);
    records = records.filter((record) => {
      logger.debug(
        `Evaluating record ${record.id} with mapId ${record.mapId} and encounter_id ${record.encounter_id}`,
      );
      const mapIdStr = String(record.mapId);
      if (entry.filter.has(mapIdStr)) {
        logger.debug(
          `Record ${record.id} matches dungeon filter for mapId ${mapIdStr}`,
        );
        const encounterIds = entry.filter.get(mapIdStr);
        if (!encounterIds || encounterIds.length === 0) {
          return true;
        }
        return encounterIds.includes(record.encounter_id);
      }
      return false;
    });
  }

  const exists = await db.initRecords(guild_id);
  if (!exists) {
    logger.info(
      `First initialization for guild ${guild_id}, skipping notifications and saving record IDs`,
    );
    const sended_records = records.map((record) => record.id);
    await db.pushRecords(guild_id, sended_records);
    return;
  }

  const record_checks = await Promise.all(
    records.map((record) =>
      db.checkRecord(guild_id, record.id).then((exists) => ({
        record,
        exists,
      })),
    ),
  );

  const new_records = record_checks.filter(({ exists }) => !exists);

  if (new_records.length === 0) {
    return;
  }

  const sended_records = [];

  for (const { record } of new_records) {
    const settingsActive = await hasActiveLootSettings(guild_id, entry.channel_id);
    if (!settingsActive) {
      logger.info(
        `Stopped loot processing for guild ${guild_id}: loot settings were cleared`,
      );
      break;
    }

    const recordId = await getExtraInfoAndSend(entry, guild_id, record);
    if (recordId) {
      sended_records.push(recordId);
    }
  }

  logger.debug(
    `Sent ${sended_records.length} new boss kill notifications for guild ${guild_id}`,
  );

  if (sended_records.length > 0) {
    await db.pushRecords(guild_id, sended_records);
  }
}

/**
 * Gets boss kill extra info and sends to Discord
 * @param {Object} entry - Loot settings entry
 * @param {string} guild_id - Discord guild ID
 * @param {Object} record - Boss kill record
 * @returns {Promise<number|null>} Record ID if sent successfully, null otherwise
 */
async function getExtraInfoAndSend(entry, guild_id, record) {
  if (!client.guilds.cache.get(guild_id)) {
    logger.warn(`Guild ${guild_id} not found in cache`);
    return null;
  }

  try {
    logger.debug(
      `Processing new boss kill record ${record.id} for guild ${guild_id}`,
    );

    if (!(await hasActiveLootSettings(guild_id, entry.channel_id))) {
      logger.info(
        `Skipping record ${record.id} for guild ${guild_id}: loot settings were cleared`,
      );
      return null;
    }

    const message = await getExtraInfo(guild_id, record.id, entry.realm_id);
    if (!message) {
      throw new Error("Empty message received!");
    }

    if (!(await hasActiveLootSettings(guild_id, entry.channel_id))) {
      logger.info(
        `Skipping send for record ${record.id} in guild ${guild_id}: loot settings were cleared`,
      );
      return null;
    }

    const delivered = await sendToChannel(
      client,
      entry.channel_id,
      message.embeds,
      message.files || [],
    );

    if (!delivered) {
      logger.info(
        `Notification for record ${record.id} was not delivered to channel ${entry.channel_id}`,
      );
      return null;
    }

    logger.info(
      `Boss kill notification sent: record ${record.id} to channel ${entry.channel_id} in guild ${guild_id}`,
    );
    return record.id;
  } catch (error) {
    logger.error(
      `Error processing boss kill record ${record.id} for guild ${guild_id}: ${error.message}`,
    );
    logger.error(error);
    logger.warn(
      "Error while getting loot info:" +
        `{ guild_id: ${guild_id}, channel_id: ${entry.channel_id} }`,
    );
    return null;
  }
}

/**
 * Gets detailed boss kill information and formats embed message
 * @param {string} guild_id - Discord guild ID
 * @param {number} record_id - Boss kill record ID
 * @param {number} realm_id - Sirus realm ID
 * @returns {Promise<{embeds: Array}|null>} Formatted message object with embeds array, or null if data unavailable
 */
async function getExtraInfo(guild_id, record_id, realm_id) {
  const data_boss_kill_info = await sirusApi.getBossKillDetails(
    realm_id,
    record_id,
  );

  const bossKillInfo = data_boss_kill_info?.data ?? data_boss_kill_info;

  if (!bossKillInfo) {
    return null;
  }

  const dpsData = parseDpsPlayers(bossKillInfo.players, client);

  const hpsData = parseHealPlayers(bossKillInfo.players, client);

  const lootItems = bossKillInfo.loots
    .filter(
      (loot) => loot.item.quality >= 4 && !blacklist.includes(loot.item.entry),
    )
    .map((loot) => loot.item);

  const embeds = createCompleteBossKillEmbed({
    bossKillInfo: bossKillInfo,
    realmId: realm_id,
    recordId: record_id,
    guildId: guild_id,
    client: client,
    dpsData: dpsData,
    hpsData: hpsData,
    lootItems: lootItems,
  });

  const screenshotBuffer = await createLootScreenshotBuffer(lootItems, realm_id);
  const files = [];

  if (screenshotBuffer) {
    embeds.setImage("attachment://loot.png");
    files.push(new AttachmentBuilder(screenshotBuffer, { name: "loot.png" }));
  }

  return { embeds: [embeds], files };
}

module.exports = {
  init: init,
};
