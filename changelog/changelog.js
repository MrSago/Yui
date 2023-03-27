const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
const fs = require("fs");

const changeLogApi = "https://sirus.su/api/statistic/changelog";

const settingsFile = "./changelog/changelog.json";

const dataPath = "./data/";
const logFile = dataPath + "log.json";

const intervalUpdate = 1000 * 60 * 5;

var client = undefined;
var settings = {};

function init(discord) {
    client = discord;

    loadSettings();

    updateChangelog();
}

function setLogChannel(guild_id, channel_id) {
    settings[guild_id] = channel_id;
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 4), "utf8");
}

function loadSettings() {
    console.log(`[LOG] Load settings from ${settingsFile}`);
    try {
        settings = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
        console.log(`[LOG] Settings successfully loaded from ${settingsFile}`);
    } catch (error) {
        console.error(error);
        console.log(`[WARNING] Can't parse ${settingsFile}`);
    }
}

async function updateChangelog() {
    axios
        .get(changeLogApi, {
            headers: { "accept-encoding": null },
            cache: true,
        })
        .then(async (response) => sendData(response))
        .catch(console.error);

    setTimeout(updateChangelog, intervalUpdate);
}

async function sendData(response) {
    let data = response.data.data;
    let logs = loadLogs();

    let cnt = 0;
    for (let i = 0; i < data.length; ++i) {
        if (data[i].message[data[i].message.length - 1] === ">") {
            data[i].message = data[i].message.slice(0, -6);
        }
        if (data[i].message == logs[logs.length - 1]) {
            break;
        }
        ++cnt;
    }

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
    .setTimestamp()
    .setFooter({
        text: "Юи, ваш ассистент",
        iconURL: "https://i.imgur.com/LvlhrPY.png",
    });

    let message = "";
    for (let i = 0; i < cnt; ++i) {
        if (message.length + data[i].message.length >= 1024) {
            embedMessage.setDescription(message);
            await sendChangeLog(embedMessage);
            message = "";
        }
        message += data[i].message + "\n";
    }
    if (message.length) {
        embedMessage.setDescription(message);
        await sendChangeLog(embedMessage);
    }
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
    for (const channel_id of Object.values(settings)) {
        client.channels.cache.get(channel_id).send({ embeds: [embedMessage] });
    }
}

function saveLogs(logs) {
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 4), "utf8");
}

module.exports = {
    init: init,
    setLogChannel: setLogChannel,
};
