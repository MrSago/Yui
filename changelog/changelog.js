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
    let logs = undefined;
    let data = undefined;

    try {
        if (!fs.existsSync(tempPath)) {
            fs.mkdirSync(tempPath);
        }
        if (!fs.existsSync(logFile)) {
            fs.writeFileSync(logFile, "[]", "utf8");
        }
        logs = JSON.parse(fs.readFileSync(logFile, "utf8"));
        response = await axios.get(changeLogApi, {
            headers: { "accept-encoding": null },
            cache: true,
        });
        data = response.data.data;
    } catch (error) {
        return;
    }

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

    for (let i = 0; i < cnt; i += 5) {
        let msg = "";
        for (let j = i; j < i + 5 && j < cnt; ++j) {
            msg += data[j].message + (j == cnt - 1 ? "" : "\n\n");
        }
        try {
            const embedMessage = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle("Новые изменения на сервере Sirus.su")
                .addFields({ name: new Date().toLocaleString(), value: msg });
            sendChangeLog(embedMessage);
        } catch (error) {}
    }

    fs.writeFileSync(logFile, JSON.stringify(logs, null, 4), "utf8");

    setTimeout(updateChangelog, intervalUpdate);
}

function sendChangeLog(embedMessage) {
    for (const guild_id in settings) {
        const channel = client.channels.cache.get(settings[guild_id]);
        channel.send({ embeds: [embedMessage] });
    }
}

module.exports = {
    init: init,
    setLogChannel: setLogChannel,
};
