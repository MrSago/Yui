/**
 * @file Loot tracking module
 * @description Monitors and announces boss kills and loot information
 * @note Original code was taken from: https://github.com/JustJacob95/sirus_loot_discord_bot
 */

const { ActivityType } = require("discord.js");

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

  const settings = await db.getLootSettings();
  if (!settings) {
    logger.warn("Can't load loot settings from DB");
    setTimeout(startRefreshingLoot, INTERVAL_UPDATE_MS);
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

  const records = await sirusApi.getLatestBossKills(
    entry.realm_id,
    entry.guild_sirus_id,
  );

  if (!records) {
    logger.warn(
      `Can't get loot from realm ${sirusApi.getRealmNameById(
        entry.realm_id,
      )} with guild sirus id ${entry.guild_sirus_id}`,
    );
    return;
  }

  logger.debug(
    `Retrieved ${records.length} boss kill records for guild ${guild_id}`,
  );

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

  const promises = new_records.map(({ record }) =>
    getExtraInfoAndSend(entry, guild_id, record),
  );
  const record_ids = await Promise.allSettled(promises);
  const sended_records = record_ids
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => r.value);

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

    const message = await getExtraInfo(guild_id, record.id, entry.realm_id);
    if (!message) {
      throw new Error("Empty message received!");
    }

    await sendToChannel(client, entry.channel_id, message.embeds);
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

  if (!data_boss_kill_info) {
    return null;
  }

  const dpsData = parseDpsPlayers(data_boss_kill_info.players, client);

  const hpsData = parseHealPlayers(data_boss_kill_info.players, client);

  const lootItems = data_boss_kill_info.loots
    .filter(
      (loot) => loot.item.quality >= 4 && !blacklist.includes(loot.item.entry),
    )
    .map((loot) => loot.item);

  const embeds = createCompleteBossKillEmbed({
    bossKillInfo: data_boss_kill_info,
    realmId: realm_id,
    recordId: record_id,
    guildId: guild_id,
    client: client,
    dpsData: dpsData,
    hpsData: hpsData,
    lootItems: lootItems,
  });

  return { embeds: [embeds] };
}

module.exports = {
  init: init,
};
