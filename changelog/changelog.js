const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const db = require("../db/db.js");

const changeLogApi = "https://sirus.su/api/statistic/changelog";

const dataPath = "./data";
const logFile = `${dataPath}/log.json`;

const intervalUpdate = 1000 * 60 * 5;

var client;

function init(discord) {
  client = discord;

  updateChangelog();
}

async function updateChangelog() {
  axios
    .get(changeLogApi, {
      headers: { "accept-encoding": null },
      cache: true,
    })
    .then((response) => sendData(response))
    .catch((error) => {
      console.error(error);
      console.log("[WARNING] Can't get changelog from Sirus.su");
    });

  setTimeout(updateChangelog, intervalUpdate);
}

async function sendData(response) {
  let data = response.data.data;
  let logs = loadLogs();
  let cnt = parseData(data, logs);
  if (!cnt) {
    return;
  }

  (async () => {
    for (let i = cnt - 1; i >= 0; --i) {
      logs.push(data[i].message);
    }
    saveLogs(logs);
  })();

  const embedMessage = new EmbedBuilder()
    .setColor("#ff00ff")
    .setAuthor({
      name: "Sirus.su",
      iconURL: "https://i.imgur.com/2ZKDaJQ.png",
      url: "https://sirus.su",
    })
    .setTitle("Новые изменения на сервере Sirus.su")
    .setURL("https://sirus.su/statistic/changelog")
    .setFooter({
      text: "Юи, Ваш ассистент",
      iconURL: "https://i.imgur.com/LvlhrPY.png",
    });

  let message = "";
  for (let i = 0; i < cnt; ++i) {
    // Embedded message can have maximum of 2^12 (4096) characters
    if (message.length + data[i].message.length + 2 >= 4096) {
      embedMessage.setDescription(message);
      await sendChangeLog(embedMessage);
      message = "";
    }
    message += `${data[i].message}\n\n`;
  }
  if (message.length) {
    embedMessage.setDescription(message);
    await sendChangeLog(embedMessage);
  }
}

function parseData(data, logs) {
  let cnt = 0;
  for (let i = 0; i < data.length; ++i) {
    if (data[i].message[data[i].message.length - 1] === ">") {
      data[i].message = data[i].message.slice(0, -6);
    }
    if (data[i].message === logs[logs.length - 1]) {
      break;
    }
    ++cnt;
  }
  return cnt;
}

function loadLogs() {
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
  }
  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, "[]", "utf8");
    return [];
  }
  return JSON.parse(fs.readFileSync(logFile, "utf8"));
}

async function sendChangeLog(embedMessage) {
  const settings = await db.getChangelogSettings();
  if (!settings) {
    return;
  }

  for (const entry of settings) {
    try {
      const channel = client.channels.cache.get(entry.channel_id);
      if (channel) {
        channel.send({ embeds: [embedMessage] });
      } else {
        // db.deleteChangelogChannel(guild_id);
      }
    } catch (error) {
      console.error(error);
      console.log(`[WARNING] Can't send message to channel ${channel_id}`);
    }
  }
}

function saveLogs(logs) {
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), "utf8");
}

module.exports = {
  init: init,
};
