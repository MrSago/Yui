/*
    Original code was taken from: https://github.com/JustJacob95/sirus_loot_discord_bot
*/

const logger = require("../logger.js");
const db = require("../db/db.js");

const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
const fs = require("fs");

const apiBaseUrl = "https://sirus.su/api/base";
const latestFightsApi = "leader-board/bossfights/latest";
const bossKillApi = "leader-board/bossfights/boss-kill";
const guildsUrl = "https://sirus.su/base/guilds";
const pveProgressUrl = "https://sirus.su/base/pve-progression/boss-kill";

const scourgeId = 9;
const algalonId = 33;
const soulseekerId = 42;
const sirusId = 57;
const realmName = {
  9: "Scourge x2",
  33: "Algalon x4",
  42: "Soulseeker x1",
  57: "Sirus x5",
};
const getRealmNameById = (realm_id) => {
  if (realmName[realm_id]) {
    return realmName[realm_id];
  }
  return null;
};

const lootPath = "./loot";
const bossThumbnailsFile = `${lootPath}/bossThumbnails.json`;
const classEmojiFile = `${lootPath}/classEmoji.json`;
const blackListFile = `${lootPath}/blacklist.json`;

const intervalUpdate = 1000 * 60 * 5;

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
  logger.info(`Load boss thumbnails from ${bossThumbnailsFile}`);
  try {
    bossThumbnails = JSON.parse(fs.readFileSync(bossThumbnailsFile, "utf8"));
    logger.info(
      `Boss thumbnails successfully loaded from ${bossThumbnailsFile}`
    );
  } catch (error) {
    logger.error(error);
    logger.warn(`Can't load ${bossThumbnailsFile}`);
  }
}

function loadClassEmoji() {
  logger.info(`Load class emoji from ${classEmojiFile}`);
  try {
    classEmoji = JSON.parse(fs.readFileSync(classEmojiFile, "utf8"));
    logger.info(`Class emoji successfully loaded from ${classEmojiFile}`);
  } catch (error) {
    logger.error(error);
    logger.warn(`Can't load ${classEmojiFile}`);
  }
}

function loadBlacklist() {
  logger.info(`Load loot blacklist from ${blackListFile}`);
  try {
    blacklist = JSON.parse(fs.readFileSync(blackListFile, "utf8"));
    logger.info(`Blacklist successfully loaded from ${blackListFile}`);
  } catch (error) {
    logger.error(error);
    logger.warn(`Can't load ${blackListFile}`);
  }
}

async function startRefreshingLoot() {
  logger.info("Refreshing loot");

  const settings = await db.getLootSettings();
  if (!settings) {
    logger.warn("Can't load loot settings from DB");
    setTimeout(startRefreshingLoot, intervalUpdate);
    return;
  }

  for (const entry of settings) {
    const guild_id = await db.getGuildIdByLootId(entry._id);
    if (!guild_id) {
      continue;
    }

    let first_init = await db.initRecords(guild_id);

    let sended_records = [];

    axios
      .get(
        `${apiBaseUrl}/${entry.realm_id}/${latestFightsApi}?guild=${entry.guild_sirus_id}`,
        {
          headers: { "accept-encoding": null },
          cache: true,
        }
      )
      .then((response) => {
        Promise.all(
          response.data.data.map(async (record) => {
            if (first_init) {
              sended_records.push(record.id);
            } else {
              const record_id = await getExtraInfoWrapper(
                entry,
                guild_id,
                record
              );
              if (record_id) {
                sended_records.push(record_id);
              }
            }
          })
        ).then(() => {
          if (sended_records.length > 0) {
            db.pushRecords(guild_id, sended_records);
          }
        });
      })
      .catch((error) => {
        logger.error(error);
        logger.warn(
          `Can't get loot from realm ${getRealmNameById(
            entry.realm_id
          )} with guild sirus id ${entry.guild_sirus_id}`
        );
      });
  }

  setTimeout(startRefreshingLoot, intervalUpdate);
}

async function getExtraInfoWrapper(entry, guild_id, record) {
  if (!client.guilds.cache.get(guild_id)) {
    // clearLootChannel(guild_id);
    return null;
  }

  if (!(await db.checkRecord(guild_id, record.id))) {
    try {
      const message = await getExtraInfo(guild_id, record.id, entry.realm_id);
      const channel = client.channels.cache.get(entry.channel_id);
      if (channel) {
        channel.send(message);
        return record.id;
      }
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
  return new Promise(async (resolve, reject) => {
    let dataBossKillInfo;
    try {
      const responseBossKillInfo = await axios
        .get(`${apiBaseUrl}/${realm_id}/${bossKillApi}/${record_id}`, {
          headers: { "accept-encoding": null },
          cache: true,
        })
        .catch(reject);
      dataBossKillInfo = responseBossKillInfo.data.data;
    } catch {
      reject();
      return;
    }

    const realmName = getRealmNameById(realm_id);
    let embedMessage = new EmbedBuilder()
      .setColor("#0099ff")
      .setAuthor({
        name:
          `${dataBossKillInfo.guild.name}` +
          (realmName ? ` - ${realmName}` : ""),
        iconURL: client.guilds.cache.get(guild_id).iconURL(),
        url: `${guildsUrl}/${realm_id}/${dataBossKillInfo.guild.entry}`,
      })
      .setTitle(`Убийство босса ${dataBossKillInfo.boss_name}`)
      .setURL(`${pveProgressUrl}/${realm_id}/${record_id}`)
      .setFooter({
        text: "Юи, Ваш ассистент",
        iconURL: "https://i.imgur.com/LvlhrPY.png",
      })
      .addFields(
        {
          name: "Попытки",
          value: `${dataBossKillInfo.attempts}`,
          inline: true,
        },
        {
          name: "Когда убили",
          value: dataBossKillInfo.killed_at,
          inline: true,
        },
        {
          name: "Время боя",
          value: dataBossKillInfo.fight_length,
          inline: true,
        }
      );

    if (bossThumbnails[dataBossKillInfo.boss_name]) {
      embedMessage.setThumbnail(bossThumbnails[dataBossKillInfo.boss_name]);
    }

    const [placesDps, playersDps, dps, summaryDps] = parseDpsPlayers(
      dataBossKillInfo.players
    );
    embedMessage
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
          value: `${intToShortFormat(summaryDps)}k`,
          inline: true,
        }
      )
      .addFields(
        {
          name: "Место",
          value: placesDps,
          inline: true,
        },
        {
          name: "Имя",
          value: playersDps,
          inline: true,
        },
        {
          name: "DPS",
          value: dps,
          inline: true,
        }
      );

    const [placesHeal, playersHeal, hps, summaryHps] = parseHealPlayers(
      dataBossKillInfo.players
    );
    embedMessage
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
          value: `${intToShortFormat(summaryHps)}k`,
          inline: true,
        }
      )
      .addFields(
        {
          name: "Место",
          value: placesHeal,
          inline: true,
        },
        {
          name: "Имя",
          value: playersHeal,
          inline: true,
        },
        {
          name: "HPS",
          value: hps,
          inline: true,
        }
      );

    let loot_str = "";
    await Promise.all(
      dataBossKillInfo.loots.map((loot) => {
        if (loot.item.quality >= 4 && !blacklist.includes(loot.item.entry)) {
          loot_str += `${loot.item.name} (${loot.item.level})\n`;
        }
      })
    ).catch(reject);
    if (!loot_str || loot_str === "") {
      loot_str = "\u200b";
    }
    embedMessage
      .addFields({
        name: "\u200b",
        value: "\u200b",
      })
      .addFields({
        name: "Лут",
        value: loot_str,
      });

    resolve({ embeds: [embedMessage] });
  });
}

function parseDpsPlayers(data) {
  const easterEgg = ["Logrus", "Rozx"];
  const easterEggEmojiId = "1067786576639295488";

  data.sort((a, b) => b.dps - a.dps);

  let i = 1;
  let places = "";
  let players = "";
  let dps = "";
  let summaryDps = 0;

  for (const player of data) {
    let emoji;
    try {
      const spec = classEmoji[player.character.class_id].spec[player.spec];
      if (spec.heal) continue;
      if (easterEgg.find((item) => item === player.character.name)) {
        emoji = client.emojis.cache.get(easterEggEmojiId);
      } else {
        emoji = client.emojis.cache.get(spec.emoji_id);
      }
    } catch (error) {
      logger.error(error);
      logger.warn(`Can't get emoji for ${player.character.name}`);
    }

    places += `**${i++}**\n`;

    players += (emoji ? `${emoji}` : "") + `${player.character.name}\n`;

    const dpsInt = parseInt(player.dps);
    if (dpsInt) {
      dps += `${intToShortFormat(dpsInt)}k\n`;
      summaryDps += dpsInt;
    } else {
      dps += "0k\n";
    }
  }

  if (places === "" || players === "" || dps === "") {
    return ["\u200b", "\u200b", "\u200b", 0];
  }

  return [places, players, dps, summaryDps];
}

function parseHealPlayers(data) {
  data.sort((a, b) => b.hps - a.hps);

  let i = 1;
  let places = "";
  let players = "";
  let hps = "";
  let summaryHps = 0;

  for (const player of data) {
    let emoji;
    try {
      const spec = classEmoji[player.character.class_id].spec[player.spec];
      if (!spec.heal) continue;
      emoji = client.emojis.cache.get(spec.emoji_id);
    } catch (error) {
      logger.error(error);
      logger.warn(`Can't get emoji for ${player.character.name}`);
    }

    places += `**${i++}**\n`;

    players += (emoji ? `${emoji}` : "") + `${player.character.name}\n`;

    const hpsInt = parseInt(player.hps);
    if (hpsInt) {
      hps += `${intToShortFormat(hpsInt)}k\n`;
      summaryHps += hpsInt;
    } else {
      hps += "0k\n";
    }
  }

  if (places === "" || players === "" || hps === "") {
    return ["\u200b", "\u200b", "\u200b", 0];
  }

  return [places, players, hps, summaryHps];
}

function intToShortFormat(value) {
  return +(value.toFixed(1) / 1000).toFixed(1);
}

module.exports = {
  init: init,
};
