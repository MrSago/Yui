const logger = require("../logger.js");
const db = require("../db/db.js");
const { initBrowser, browserGet } = require("../browserGetter.js");

const axios = require("axios");
const { EmbedBuilder } = require("discord.js");
const fs = require("fs");

const CHANGELOG_API_URL = "https://sirus.su/api/statistic/changelog";

const DATA_PATH = "./data";
const LOG_FILE = `${DATA_PATH}/log.json`;

const INTERVAL_UPDATE_MS = 1000 * 60 * 60 * 10;

var client;

var browser;

function init(discord) {
  client = discord;

  startUpdatingChangelog();
}

async function startUpdatingChangelog() {
  logger.info("Updating changelog started");

  browser = await initBrowser();

  let response;
  try {
    response = await browserGet(browser, CHANGELOG_API_URL);

    // response = (
    //   await axios.get(CHANGELOG_API_URL, {
    //     headers: { "accept-encoding": null },
    //     cache: true,
    //   })
    // ).data;
  } catch (error) {
    logger.error(error);
    logger.warn("Can't get changelog from Sirus.su");
  }

  await browser.close();
  browser = null;

  if (response && response.data) {
    sendData(response.data);
  }

  logger.info("Updating changelog ended");

  setTimeout(startUpdatingChangelog, INTERVAL_UPDATE_MS);
}

async function sendData(data) {
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
    // Embedded message can have maximum of 2**12 (4096) characters
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
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(DATA_PATH);
  }
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, "[]", "utf8");
    return [];
  }
  return JSON.parse(fs.readFileSync(LOG_FILE, "utf8"));
}

async function sendChangeLog(embedMessage) {
  const settings = await db.getChangelogSettings();
  if (!settings) {
    logger.warn("Can't load changelog settings from DB");
    return;
  }

  for (const entry of settings) {
    try {
      const channel = client.channels.cache.get(entry.channel_id);
      if (!channel) {
        throw new Error(`Can't get channel with id: ${entry.channel_id}`);
      }

      channel
        .send({ embeds: [embedMessage] })
        .catch((err) => logger.error(err));
    } catch (error) {
      logger.error(error);
      logger.warn(`Can't send message to channel ${entry.channel_id}`);
    }
  }
}

function saveLogs(logs) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), "utf8");
}

module.exports = {
  init: init,
};
