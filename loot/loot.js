/**
 * @file Loot tracking module
 * @description Monitors and announces boss kills and loot information
 * @note Original code was taken from: https://github.com/JustJacob95/sirus_loot_discord_bot
 */

const logger = require("../logger.js");
const db = require("../db/database.js");
const sirusApi = require("../api/sirusApi.js");
const config = require("../config").loot;
const {
  parseDpsPlayers,
  parseHealPlayers,
  loadJsonFileWithDefault,
} = require("../utils");
const { createCompleteBossKillEmbed, sendToChannel } = require("../discord");

const { ActivityType } = require("discord.js");

const LOOT_PATH = config.dataPath;
const BOSS_THUMBNAILS_FILE = `${LOOT_PATH}/${config.files.bossThumbnails}`;
const CLASS_EMOJI_FILE = `${LOOT_PATH}/${config.files.classEmoji}`;
const BLACKLIST_FILE = `${LOOT_PATH}/${config.files.blacklist}`;

const INTERVAL_UPDATE_MS = config.updateIntervalMs;

var client;
var bossThumbnails = {};
var classEmoji = {};
var blacklist = [];

/**
 * Initializes loot tracking
 * @param {import('discord.js').Client} discord - Discord client instance
 */
function init(discord) {
  client = discord;

  bossThumbnails = loadJsonFileWithDefault(
    BOSS_THUMBNAILS_FILE,
    {},
    "boss thumbnails"
  );
  classEmoji = loadJsonFileWithDefault(CLASS_EMOJI_FILE, {}, "class emoji");
  blacklist = loadJsonFileWithDefault(BLACKLIST_FILE, [], "loot blacklist");

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

  const entry_promises = [];
  for (const entry of settings) {
    const guild_id = await db.getGuildIdByLootId(entry._id);
    if (!guild_id) {
      continue;
    }
    entry_promises.push(entryProcess(entry, guild_id));
  }
  await Promise.all(entry_promises);

  client.user.setPresence({
    activities: [
      {
        name: config.activity.idleStatus.name,
        type: ActivityType[config.activity.idleStatus.type],
      },
    ],
    status: config.activity.idleStatus.status,
  });
  logger.info("Refreshing loot ended");

  setTimeout(startRefreshingLoot, INTERVAL_UPDATE_MS);
}

/**
 * Processes a single loot entry for a guild
 * @param {Object} entry - Loot settings entry
 * @param {string} guild_id - Discord guild ID
 */
async function entryProcess(entry, guild_id) {
  const records = await sirusApi.getLatestBossKills(
    entry.realm_id,
    entry.guild_sirus_id
  );

  if (!records) {
    logger.warn(
      `Can't get loot from realm ${sirusApi.getRealmNameById(
        entry.realm_id
      )} with guild sirus id ${entry.guild_sirus_id}`
    );
    return;
  }

  const first_init = await db.initRecords(guild_id);
  const sended_records = [];
  const promises = [];

  for (const record of records) {
    if (first_init) {
      sended_records.push(record.id);
    } else {
      promises.push(getExtraInfoWrapper(entry, guild_id, record));
    }
  }

  if (promises.length > 0) {
    const record_ids = await Promise.all(promises);
    sended_records.push(...record_ids.filter(Boolean));
  }

  if (sended_records.length > 0) {
    await db.pushRecords(guild_id, sended_records);
  }
}

/**
 * Wrapper for getting boss kill extra info and sending to Discord
 * @param {Object} entry - Loot settings entry
 * @param {string} guild_id - Discord guild ID
 * @param {Object} record - Boss kill record
 * @returns {Promise<number|null>} Record ID if sent successfully, null otherwise
 */
async function getExtraInfoWrapper(entry, guild_id, record) {
  if (!client.guilds.cache.get(guild_id)) {
    return null;
  }

  if (!(await db.checkRecord(guild_id, record.id))) {
    try {
      const message = await getExtraInfo(guild_id, record.id, entry.realm_id);
      if (!message) {
        throw new Error("Empty message getted!");
      }

      await sendToChannel(client, entry.channel_id, message.embeds);
      return record.id;
    } catch (error) {
      logger.error(error);
      logger.warn(
        "Error while getting loot info:" +
          `{ guild_id: ${guild_id}, channel_id: ${entry.channel_id} }`
      );
    }
  }
  return null;
}

/**
 * Gets detailed boss kill information and formats embed message
 * @param {string} guild_id - Discord guild ID
 * @param {number} record_id - Boss kill record ID
 * @param {number} realm_id - Realm ID
 * @returns {Promise<Object|null>} Formatted message object or null
 */
async function getExtraInfo(guild_id, record_id, realm_id) {
  const data_boss_kill_info = await sirusApi.getBossKillDetails(
    realm_id,
    record_id
  );

  if (!data_boss_kill_info) {
    return null;
  }

  const dpsData = parseDpsPlayers(
    data_boss_kill_info.players,
    classEmoji,
    client,
    config.easterEgg
  );

  const hpsData = parseHealPlayers(
    data_boss_kill_info.players,
    classEmoji,
    client
  );

  const lootItems = [];
  try {
    await Promise.all(
      data_boss_kill_info.loots.map((loot) => {
        if (loot.item.quality >= 4 && !blacklist.includes(loot.item.entry)) {
          lootItems.push(loot.item.name);
        }
      })
    );
  } catch (error) {
    logger.error(error);
    logger.warning("Shit happens...");
    return;
  }

  const embed = createCompleteBossKillEmbed({
    bossKillInfo: data_boss_kill_info,
    realmId: realm_id,
    recordId: record_id,
    guildId: guild_id,
    client: client,
    bossThumbnails: bossThumbnails,
    dpsData: dpsData,
    hpsData: hpsData,
    lootItems: lootItems,
  });

  return { embeds: [embed] };
}

module.exports = {
  init: init,
};
