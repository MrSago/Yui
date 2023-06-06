/*
    Original code was taken from: https://github.com/JustJacob95/sirus_loot_discord_bot
*/

const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
const puppeteer = require("puppeteer");
const fs = require("fs");

const apiBaseUrl = "https://sirus.su/api/base";
const latestFightsApi = "leader-board/bossfights/latest";
const bossKillApi = "leader-board/bossfights/boss-kill";
const toolTipsItemApiUrl = "https://sirus.su/api/tooltips/item";
const guildsUrl = "https://sirus.su/base/guilds";
const pveProgressUrl = "https://sirus.su/base/pve-progression/boss-kill";

const scourgeId = 9;
const algalonId = 33;
const sirusId = 57;
const getRealmNameById = (realm_id) => {
  const realmName = {
    9: "Scourge x2",
    33: "Algalon x4",
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

const settingsPath = "./settings";
const settingsFile = `${settingsPath}/loot.json`;

const dataPath = "./data";
const screenshotsPath = `${dataPath}/images`;
const recordsFile = `${dataPath}/records.json`;

const stylePath = "./styles";
const mainStyleFile = `${stylePath}/main.css`;
const otherStyleFile = `${stylePath}/other.css`;
const borderStyleFile = `${stylePath}/border.css`;

const intervalUpdate = 1000 * 60 * 1;

var client;
var settings = {};
var bossThumbnails = {};
var classEmoji = {};
var records = {};
var refreshingLoots = {};

var mainStyle;
var otherStyle;
var borderStyle;

function init(discord) {
  client = discord;

  loadSettings();
  loadBossThumbnails();
  loadClassEmoji();
  loadRecords();
  loadStyles();

  if (!fs.existsSync(screenshotsPath)) {
    fs.mkdirSync(screenshotsPath);
  }

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

function loadStyles() {
  console.log(`[LOG] Load styles from path ${stylePath}`);
  try {
    mainStyle = fs.readFileSync(mainStyleFile, "utf8");
    otherStyle = fs.readFileSync(otherStyleFile, "utf8");
    borderStyle = fs.readFileSync(borderStyleFile, "utf8");
    console.log(`[LOG] Styles successfully loaded`);
  } catch (error) {
    console.error(error);
    console.log(`[WARNING] Can't load some style`);
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
    const responseBossKillInfo = await axios
      .get(`${apiBaseUrl}/${realm_id}/${bossKillApi}/${record_id}`, {
        headers: { "accept-encoding": null },
        cache: true,
      })
      .catch(reject);
    const dataBossKillInfo = responseBossKillInfo.data.data;

    let lootHtml = await Promise.all(
      dataBossKillInfo.loots.map((loot) => getLootInfo(loot.item, realm_id))
    ).catch(reject);
    lootHtml = lootHtml.join().replaceAll(",", "");

    let fileName;
    if (lootHtml) {
      const html = `<!doctype html> <html><body><div style="display: flex; justify-content: center;">
                ${lootHtml}
                </div></body></html>`;
      fileName = [...Array(10)]
        .map(() => (~~(Math.random() * 36)).toString(36))
        .join("");
      try {
        await takeSceenshot(html, fileName);
      } catch (error) {
        console.error(error);
        console.log("[WARNING] Can't take loot screenshot");
        lootHtml = null;
      }
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

    if (lootHtml) {
      embedMessage
        .addFields({
          name: "\u200b",
          value: "\u200b",
        })
        .addFields({
          name: "Лут",
          value: "\u200b",
          inline: false,
        });
      embedMessage.setImage(`attachment://${fileName}.png`);

      resolve({
        embeds: [embedMessage],
        files: [
          {
            attachment: `${screenshotsPath}/${fileName}.png`,
            name: `${fileName}.png`,
          },
        ],
      });
    } else {
      resolve({ embeds: [embedMessage] });
    }
  });
}

async function getLootInfo(item, realm_id) {
  if (item.inventory_type && item.quality === 4 && item.level >= 200) {
    let responseLoot = await axios.get(
      `${toolTipsItemApiUrl}/${item.entry}/${realm_id}`,
      { headers: { "accept-encoding": null }, cache: true }
    );
    return responseLoot.data.trim();
  } else {
    return "";
  }
}

async function takeSceenshot(html, fileName) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--window-size=1400,800"],
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.setContent(html);
  await page.addStyleTag({ content: mainStyle });
  await page.addStyleTag({ content: otherStyle });
  await page.addStyleTag({ content: borderStyle });
  await page.screenshot({
    path: `${screenshotsPath}/${fileName}.png`,
    fullPage: false,
    omitBackground: true,
  });

  await browser.close();
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
