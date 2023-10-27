/*
    Original code was taken from: https://github.com/JustJacob95/sirus_loot_discord_bot
*/

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
const getRealmNameById = (realm_id) => {
  const realmName = {
    9: "Scourge x2",
    33: "Algalon x4",
    42: "Soulseeker x1",
    57: "Sirus x5",
  };
  if (realm_id in realmName) {
    return realmName[realm_id];
  }
  return null;
};

const lootPath = "./loot";
const bossThumbnailsFile = `${lootPath}/bossThumbnails.json`;
const classEmojiFile = `${lootPath}/classEmoji.json`;
const blackListFile = `${lootPath}/blacklist.json`;

const settingsPath = "./settings";
const settingsFile = `${settingsPath}/loot.json`;

const dataPath = "./data";
const recordsFile = `${dataPath}/records.json`;

const intervalUpdate = 1000 * 60 * 5;

var client;
var settings = {};
var bossThumbnails = {};
var classEmoji = {};
var blacklist = [];
var records = {};
var refreshingLoots = {};

function init(discord) {
  client = discord;

  loadSettings();
  loadBossThumbnails();
  loadClassEmoji();
  loadBlacklist();
  loadRecords();

  for (const guild_id of Object.keys(settings)) {
    refreshingLoots[guild_id] = true;
    refreshLoot(guild_id);
  }
}

function setLootChannel(guild_id, channel_id, realm_id, guild_sirus_id) {
  if (!settings[guild_id]) {
    settings[guild_id] = {};
  }
  settings[guild_id].channel_id = channel_id;
  settings[guild_id].realm_id = realm_id;
  settings[guild_id].guild_sirus_id = guild_sirus_id;
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), "utf8");

  initGuildRecords(guild_id);
}

function clearLootChannel(guild_id) {
  if (guild_id in settings) {
    delete settings[guild_id];
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), "utf8");

    delete records[guild_id];
    fs.writeFileSync(recordsFile, JSON.stringify(records, null, 2), "utf8");
  }
}

function loadSettings() {
  console.log(`[LOG] Load settings from ${settingsFile}`);
  try {
    if (!fs.existsSync(settingsPath)) {
      fs.mkdirSync(settingsPath);
    }
    settings = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
    console.log(`[LOG] Settings successfully loaded from ${settingsFile}`);
  } catch (error) {
    console.error(error);
    console.log(`[WARNING] Can't load ${settingsFile}`);
  }
}

function loadBossThumbnails() {
  console.log(`[LOG] Load boss thumbnails from ${bossThumbnailsFile}`);
  try {
    bossThumbnails = JSON.parse(fs.readFileSync(bossThumbnailsFile, "utf8"));
    console.log(
      `[LOG] Boss thumbnails successfully loaded from ${bossThumbnailsFile}`
    );
  } catch (error) {
    console.error(error);
    console.log(`[WARNING] Can't load ${bossThumbnailsFile}`);
  }
}

function loadClassEmoji() {
  console.log(`[LOG] Load class emoji from ${classEmojiFile}`);
  try {
    classEmoji = JSON.parse(fs.readFileSync(classEmojiFile, "utf8"));
    console.log(`[LOG] Class emoji successfully loaded from ${classEmojiFile}`);
  } catch (error) {
    console.error(error);
    console.log(`[WARNING] Can't load ${classEmojiFile}`);
  }
}

function loadBlacklist() {
  console.log(`[LOG] Load loot blacklist from ${blackListFile}`);
  try {
    blacklist = JSON.parse(fs.readFileSync(blackListFile, "utf8"));
    console.log(`[LOG] Blacklist successfully loaded from ${blackListFile}`);
  } catch (error) {
    console.error(error);
    console.log(`[WARNING] Can't load ${blackListFile}`);
  }
}

function loadRecords() {
  console.log(`[LOG] Load records from ${recordsFile}`);
  try {
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath);
    }
    records = JSON.parse(fs.readFileSync(recordsFile, "utf8"));
    console.log(`[LOG] Records successfully loaded from ${recordsFile}`);
  } catch (error) {
    console.error(error);
    console.log(`[WARNING] Can't load ${recordsFile}`);
  }
}

async function initGuildRecords(guild_id) {
  const entry = settings[guild_id];

  if (!records[guild_id]) {
    records[guild_id] = [];
  }

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
        response.data.data.map((record) => records[guild_id].push(record.id))
      ).then(() => {
        fs.writeFileSync(recordsFile, JSON.stringify(records, null, 2), "utf8");
      });
    })
    .catch((error) => {
      console.error(error);
      console.log(
        `[WARNING] Can't get loot from realm ${getRealmNameById(
          entry.realm_id
        )} with guild sirus id ${entry.guild_sirus_id}`
      );
    });

  if (!refreshingLoots[guild_id]) {
    refreshingLoots[guild_id] = true;
    setTimeout(refreshLoot, intervalUpdate, guild_id);
  }
}

async function refreshLoot(guild_id) {
  const entry = settings[guild_id];
  if (!entry) {
    delete refreshingLoots[guild_id];
    return;
  }

  await axios
    .get(
      `${apiBaseUrl}/${entry.realm_id}/${latestFightsApi}?guild=${entry.guild_sirus_id}`,
      {
        headers: { "accept-encoding": null },
        cache: true,
      }
    )
    .then((response) => {
      Promise.all(
        response.data.data.map((record) =>
          getExtraInfoWrapper(guild_id, record)
        )
      ).then(() => {
        fs.writeFileSync(recordsFile, JSON.stringify(records, null, 2), "utf8");
      });
    })
    .catch((error) => {
      console.error(error);
      console.log(
        `[WARNING] Can't get loot from realm ${getRealmNameById(
          entry.realm_id
        )} with guild sirus id ${entry.guild_sirus_id}`
      );
    });

  setTimeout(refreshLoot, intervalUpdate, guild_id);
}

async function getExtraInfoWrapper(guild_id, record) {
  const entry = settings[guild_id];

  if (!client.guilds.cache.get(guild_id)) {
    clearLootChannel(guild_id);
    return;
  }

  if (records[guild_id].indexOf(record.id) < 0 && record.boss_name) {
    await getExtraInfo(guild_id, record.id, entry.realm_id)
      .then(async (message) => {
        const channel = client.channels.cache.get(entry.channel_id);
        if (channel) {
          channel.send(message);
          records[guild_id].push(record.id);
        }
      })
      .catch((error) => {
        console.error(error);
        console.log(`[WARNING] Can't get loot from record ${record.id}`);
      });
  }
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
        if (
          loot.item.quality >= 4 &&
          !blacklist.includes(loot.item.entry)
        ) {
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
      console.error(error);
      console.log(`[WARNING] Can't get emoji for ${player.character.name}`);
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
      console.error(error);
      console.log(`[WARNING] Can't get emoji for ${player.character.name}`);
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
  setLootChannel: setLootChannel,
  clearLootChannel: clearLootChannel,
};
