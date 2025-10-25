/*
    Original code was taken from: https://github.com/JustJacob95/sirus_loot_discord_bot
*/

const logger = require("../logger.js");
const db = require("../db/db.js");
const sirusApi = require("../api/sirusApi.js");
const config = require("../config").loot;

const { EmbedBuilder, ActivityType } = require("discord.js");
const fs = require("fs");

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
  logger.info(`Load boss thumbnails from ${BOSS_THUMBNAILS_FILE}`);
  try {
    bossThumbnails = JSON.parse(fs.readFileSync(BOSS_THUMBNAILS_FILE, "utf8"));
    logger.info(
      `Boss thumbnails successfully loaded from ${BOSS_THUMBNAILS_FILE}`
    );
  } catch (error) {
    logger.error(error);
    logger.warn(`Can't load ${BOSS_THUMBNAILS_FILE}`);
  }
}

function loadClassEmoji() {
  logger.info(`Load class emoji from ${CLASS_EMOJI_FILE}`);
  try {
    classEmoji = JSON.parse(fs.readFileSync(CLASS_EMOJI_FILE, "utf8"));
    logger.info(`Class emoji successfully loaded from ${CLASS_EMOJI_FILE}`);
  } catch (error) {
    logger.error(error);
    logger.warn(`Can't load ${CLASS_EMOJI_FILE}`);
  }
}

function loadBlacklist() {
  logger.info(`Load loot blacklist from ${BLACKLIST_FILE}`);
  try {
    blacklist = JSON.parse(fs.readFileSync(BLACKLIST_FILE, "utf8"));
    logger.info(`Blacklist successfully loaded from ${BLACKLIST_FILE}`);
  } catch (error) {
    logger.error(error);
    logger.warn(`Can't load ${BLACKLIST_FILE}`);
  }
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
    data_boss_kill_info.players
  );
  if (places_dps && players_dps && dps && summary_dps) {
    embed_message
      .addFields({
        name: "\u200b",
        value: "\u200b",
      })
      .addFields(
        {
          name: "\u200b",
          value: "\u200b",
          inline: true,
        },
        {
          name: "\u200b",
          value: "\u200b",
          inline: true,
        },
        {
          name: "Общий DPS",
          value: `${intToShortFormat(summary_dps)}k`,
          inline: true,
        }
      )
      .addFields(
        {
          name: "Место",
          value: places_dps,
          inline: true,
        },
        {
          name: "Имя",
          value: players_dps,
          inline: true,
        },
        {
          name: "DPS",
          value: dps,
          inline: true,
        }
      );
  }

  const [places_heal, players_heal, hps, summary_hps] = parseHealPlayers(
    data_boss_kill_info.players
  );
  if (places_heal && places_heal && hps && summary_hps) {
    embed_message
      .addFields({
        name: "\u200b",
        value: "\u200b",
      })
      .addFields(
        {
          name: "\u200b",
          value: "\u200b",
          inline: true,
        },
        {
          name: "\u200b",
          value: "\u200b",
          inline: true,
        },
        {
          name: "Общий HPS",
          value: `${intToShortFormat(summary_hps)}k`,
          inline: true,
        }
      )
      .addFields(
        {
          name: "Место",
          value: places_heal,
          inline: true,
        },
        {
          name: "Имя",
          value: players_heal,
          inline: true,
        },
        {
          name: "HPS",
          value: hps,
          inline: true,
        }
      );
  }

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
  if (loot_str !== "") {
    embed_message
      .addFields({
        name: "\u200b",
        value: "\u200b",
      })
      .addFields({
        name: "Лут",
        value: loot_str,
      });
  }

  return { embeds: [embed_message] };
}

function parseDpsPlayers(data) {
  data.sort((a, b) => b.dps - a.dps);

  let i = 1;
  let places = "";
  let players = "";
  let dps = "";
  let summary_dps = 0;

  for (const player of data) {
    let emoji;
    try {
      const spec = classEmoji[player.class_id].spec[player.spec];
      if (spec.heal) continue;
      if (config.easterEgg.players.includes(player.name)) {
        emoji = client.emojis.cache.get(config.easterEgg.emojiId);
      } else {
        emoji = client.emojis.cache.get(spec.emoji_id);
      }
    } catch (error) {
      logger.error(error);
      logger.warn(`Can't get emoji for ${player.name}`);
    }

    places += `**${i++}**\n`;

    players += (emoji ? `${emoji}` : "") + `${player.name}\n`;

    const dps_int = parseInt(player.dps);
    if (dps_int) {
      dps += `${intToShortFormat(dps_int)}k\n`;
      summary_dps += dps_int;
    } else {
      dps += "0k\n";
    }
  }

  if (places === "" || players === "" || dps === "") {
    return ["\u200b", "\u200b", "\u200b", 0];
  }

  return [places, players, dps, summary_dps];
}

function parseHealPlayers(data) {
  data.sort((a, b) => b.hps - a.hps);

  let i = 1;
  let places = "";
  let players = "";
  let hps = "";
  let summary_hps = 0;

  for (const player of data) {
    let emoji;
    try {
      const spec = classEmoji[player.class_id].spec[player.spec];
      if (!spec.heal) continue;
      emoji = client.emojis.cache.get(spec.emoji_id);
    } catch (error) {
      logger.error(error);
      logger.warn(`Can't get emoji for ${player.name}`);
    }

    places += `**${i++}**\n`;

    players += (emoji ? `${emoji}` : "") + `${player.name}\n`;

    const hpsInt = parseInt(player.hps);
    if (hpsInt) {
      hps += `${intToShortFormat(hpsInt)}k\n`;
      summary_hps += hpsInt;
    } else {
      hps += "0k\n";
    }
  }

  if (places === "" || players === "" || hps === "") {
    return ["\u200b", "\u200b", "\u200b", 0];
  }

  return [places, players, hps, summary_hps];
}

function intToShortFormat(value) {
  return +(value.toFixed(1) / 1000).toFixed(1);
}

module.exports = {
  init: init,
};
