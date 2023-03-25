const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
const fs = require("fs");

const changeLogApi = "https://sirus.su/api/statistic/changelog";

const settingsFile = "./changelog/changelog.json";

const tempPath = "./temp/";
const logFile = tempPath + "log.json";

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
        .then((response) => sendData(response))
        .catch(console.error);

    setTimeout(updateChangelog, intervalUpdate);
}

async function sendData(response) {
    let data = response.data.data;
    let logs = loadLogs();

    let cnt = 0;
    for (let i = 0; i < data.length; ++i) {
        if (data[i].message != logs[logs.length - 1]) {
            ++cnt;
        } else {
            break;
        }
    }

    if (!cnt) {
        return;
    }

    for (let i = cnt - 1; i >= 0; --i) {
        logs.push(data[i].message);
    }

    const lines = 5;
    for (let i = 0; i < cnt; i += lines) {
        let msg = "";
        for (let j = i; j < i + lines && j < cnt; ++j) {
            msg += data[j].message + (j == cnt - 1 ? "" : "\n\n");
        }
        const embedMessage = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle("Новые изменения на сервере Sirus.su")
            .addFields({ name: new Date().toLocaleString(), value: msg });
        await sendChangeLog(embedMessage);
    }

    saveLogs(logs);
}

function loadLogs() {
    if (!fs.existsSync(tempPath)) {
        fs.mkdirSync(tempPath);
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
