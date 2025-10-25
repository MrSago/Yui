/*
    Original code was taken from: https://github.com/JustJacob95/sirus_loot_discord_bot
*/

const logger = require("../logger.js");
const db = require("../db/db.js");
const sirusApi = require("../api/sirusApi.js");
const config = require("../config").loot;
const {
  parseDpsPlayers,
  parseHealPlayers,
  loadJsonFileWithDefault,
  addDpsSection,
  addHpsSection,
  addLootSection,
} = require("../utils");

const { EmbedBuilder, ActivityType } = require("discord.js");

const LOOT_PATH = config.dataPath;
const BOSS_THUMBNAILS_FILE = `${LOOT_PATH}/${config.files.bossThumbnails}`;
const CLASS_EMOJI_FILE = `${LOOT_PATH}/${config.files.classEmoji}`;
const BLACKLIST_FILE = `${LOOT_PATH}/${config.files.blacklist}`;

const INTERVAL_UPDATE_MS = config.updateIntervalMs;

var client;
var bossThumbnails = {};
var classEmoji = {};
var blacklist = [];

function init(discord) {
  client = discord;

  loadBossThumbnails();
  loadClassEmoji();
  loadBlacklist();

  startRefreshingLoot();
}

function loadBossThumbnails() {
  bossThumbnails = loadJsonFileWithDefault(
    BOSS_THUMBNAILS_FILE,
    {},
    "boss thumbnails"
  );
}

function loadClassEmoji() {
  classEmoji = loadJsonFileWithDefault(CLASS_EMOJI_FILE, {}, "class emoji");
}

function loadBlacklist() {
  blacklist = loadJsonFileWithDefault(BLACKLIST_FILE, [], "loot blacklist");
}

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

      const channel = client.guilds.cache
        .get(guild_id)
        .channels.cache.get(entry.channel_id);
      if (!channel || !channel.send) {
        throw new Error(`Can't get channel with id: ${entry.channel_id}`);
      }

      channel.send(message).catch((err) => logger.error(err));
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

async function getExtraInfo(guild_id, record_id, realm_id) {
  const data_boss_kill_info = await sirusApi.getBossKillDetails(
    realm_id,
    record_id
  );

  if (!data_boss_kill_info) {
    return null;
  }

  const realm_name = sirusApi.getRealmNameById(realm_id);
  let embed_message = new EmbedBuilder()
    .setColor(config.embed.color)
    .setAuthor({
      name:
        `${data_boss_kill_info.guild.name}` +
        (realm_name ? ` - ${realm_name}` : ""),
      iconURL: client.guilds.cache.get(guild_id).iconURL(),
      url: sirusApi.getGuildUrl(realm_id, data_boss_kill_info.guild.id),
    })
    .setTitle(`Убийство босса ${data_boss_kill_info.boss_name}`)
    .setURL(sirusApi.getPveProgressUrl(realm_id, record_id))
    .setFooter({
      text: config.embed.footerText,
      iconURL: config.embed.footerIconUrl,
    })
    .addFields(
      {
        name: "Попытки",
        value: `${data_boss_kill_info.attempts}`,
        inline: true,
      },
      {
        name: "Когда убили",
        value: data_boss_kill_info.killed_at,
        inline: true,
      },
      {
        name: "Время боя",
        value: data_boss_kill_info.fight_length,
        inline: true,
      }
    );

  if (data_boss_kill_info.boss_name in bossThumbnails) {
    embed_message.setThumbnail(bossThumbnails[data_boss_kill_info.boss_name]);
  }

  const [places_dps, players_dps, dps, summary_dps] = parseDpsPlayers(
    data_boss_kill_info.players,
    classEmoji,
    client,
    config.easterEgg
  );
  addDpsSection(embed_message, places_dps, players_dps, dps, summary_dps);

  const [places_heal, players_heal, hps, summary_hps] = parseHealPlayers(
    data_boss_kill_info.players,
    classEmoji,
    client
  );
  addHpsSection(embed_message, places_heal, players_heal, hps, summary_hps);

  let loot_str = "";
  try {
    await Promise.all(
      data_boss_kill_info.loots.map((loot) => {
        if (loot.item.quality >= 4 && !blacklist.includes(loot.item.entry)) {
          loot_str += `${loot.item.name}\n`;
        }
      })
    );
  } catch (error) {
    logger.error(error);
    logger.warning("Shit happens...");
    return;
  }

  addLootSection(embed_message, loot_str);

  return { embeds: [embed_message] };
}

module.exports = {
  init: init,
};
