const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
const puppeteer = require("puppeteer");
const fs = require("fs");

const apiBase = "https://sirus.su/api/base/";
const latestFightsApi = "/leader-board/bossfights/latest?realm=";
const bossKillApi = "/leader-board/bossfights/boss-kill/";
const toolTipsItemApi = "https://sirus.su/api/tooltips/item/";
const guildsUrl = "https://sirus.su/base/guilds/";
const pveProgressUrl = "https://sirus.su/base/pve-progression/boss-kill/";

const getRealmNameById = (realm_id) => {
    const realmName = {
        9: "Scourge x2",
        33: "Algalon x4",
        57: "Sirus x5",
    };
    if (realm_id in realmName) {
        return realmName[realm_id];
    }
    return undefined;
};

const lootPath = "./loot/";
const settingsFile = lootPath + "loot.json";
const bossThumbnailsFile = lootPath + "bossThumbnails.json";

const dataPath = "./data/";
const recordsFile = dataPath + "records.json";

const stylePath = "./styles/";
const mainStyleFile = stylePath + "main.css";
const otherStyleFile = stylePath + "other.css";
const borderStyleFile = stylePath + "border.css";

const intervalUpdate = 1000 * 60 * 5;

var client = undefined;
var settings = {};
var records = {};
var bossThumbnails = {};

var mainStyle = undefined;
var otherStyle = undefined;
var borderStyle = undefined;

function init(discord) {
    client = discord;

    loadSettings();
    loadBossThumbnails();
    loadRecords();
    loadStyles();

    const scourgeId = 9;
    const algalonId = 33;
    const sirusId = 57;

    refreshLoot(scourgeId);
    refreshLoot(algalonId);
    refreshLoot(sirusId);
}

function setLootChannel(guild_id, channel_id, realm_id, guild_sirus_id) {
    if (settings[guild_id] === undefined) {
        settings[guild_id] = {};
    }
    settings[guild_id].channel_id = channel_id;
    settings[guild_id].realm_id = realm_id;
    settings[guild_id].guild_sirus_id = guild_sirus_id;
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

function loadBossThumbnails() {
    console.log(`[LOG] Load boss thumbnails from ${bossThumbnailsFile}`);
    try {
        bossThumbnails = JSON.parse(
            fs.readFileSync(bossThumbnailsFile, "utf8")
        );
        console.log(
            `[LOG] Boss thumbnails successfully loaded from ${bossThumbnailsFile}`
        );
    } catch (error) {
        console.error(error);
        console.log(`[WARNING] Can't parse ${bossThumbnailsFile}`);
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
        console.log(`[WARNING] Can't parse ${recordsFile}`);
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

async function refreshLoot(realm_id) {
    axios
        .get(apiBase + `${realm_id}` + latestFightsApi + `${realm_id}`, {
            headers: { "accept-encoding": null },
            cache: true,
        })
        .then((response) => {
            Promise.all(
                response.data.data.map((record) => getExtraInfoWrapper(record))
            ).then(() => {
                fs.writeFileSync(
                    recordsFile,
                    JSON.stringify(records, null, 4),
                    "utf8"
                );
            });
        })
        .catch((error) => {
            console.error(error);
            console.log(`[WARNING] Can't get loot from realm ${realm_id}`);
        });

    setTimeout(refreshLoot, intervalUpdate, realm_id);
}

async function getExtraInfoWrapper(record) {
    for (const [guild_id, entry] of Object.entries(settings)) {
        if (records[guild_id] === undefined) {
            records[guild_id] = [];
        }
        if (
            record.guildId === entry.guild_sirus_id &&
            records[guild_id].indexOf(record.id) < 0 &&
            record.boss_name
        ) {
            await getExtraInfo(guild_id, record.id, entry.realm_id)
                .then(async (message) => {
                    client.channels.cache.get(entry.channel_id).send(message);
                    records[guild_id].push(record.id);
                })
                .catch((error) => {
                    console.error(error);
                    console.log(
                        `[WARNING] Can't get loot from record ${record.id}`
                    );
                });
        }
    }
}

async function getExtraInfo(guild_id, record_id, realm_id) {
    return new Promise(async (resolve, reject) => {
        const responseBossKillInfo = await axios
            .get(apiBase + `${realm_id}` + bossKillApi + record_id, {
                headers: { "accept-encoding": null },
                cache: true,
            })
            .catch(reject);
        const dataBossKillInfo = responseBossKillInfo.data.data;

        let lootHtml = await Promise.all(
            dataBossKillInfo.loots.map((loot) =>
                getLootInfo(loot.item, realm_id)
            )
        ).catch(reject);
        lootHtml = lootHtml.join().replaceAll(",", "");

        let fileName = undefined;
        if (lootHtml) {
            const html =
                '<!doctype html> <html><body><div style="display: flex; justify-content: center;">' +
                lootHtml +
                "</div></body></html>";
            fileName = [...Array(10)]
                .map(() => (~~(Math.random() * 36)).toString(36))
                .join("");
            try {
                await takeSceenshot(
                    html,
                    fileName,
                    dataBossKillInfo.loots.length
                );
            } catch (error) {
                console.error(error);
                console.log("[WARNING] Can't take loot screenshot");
                lootHtml = undefined;
            }
        }

        const realmName = getRealmNameById(realm_id);
        let embedMessage = new EmbedBuilder()
            .setColor("#0099ff")
            .setAuthor({
                name:
                    `${dataBossKillInfo.guild.name}` +
                    (realmName !== undefined ? ` - ${realmName}` : ""),
                iconURL: client.guilds.cache.get(guild_id).iconURL(),
                url: guildsUrl + `${realm_id}/${dataBossKillInfo.guild.entry}/`,
            })
            .setTitle("Упал босс " + dataBossKillInfo.boss_name)
            .setURL(pveProgressUrl + `${realm_id}/` + record_id)
            .setFooter({
                text: "Юи, ваш ассистент",
                iconURL: "https://i.imgur.com/LvlhrPY.png",
            })
            .addFields(
                {
                    name: "Попытки",
                    value: dataBossKillInfo.attempts.toString(),
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

        const [places, players, dps, summaryDps] = parsePlayers(
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
                    name: "Суммарный DPS",
                    value: `${summaryDps}`,
                    inline: true,
                }
            )
            .addFields({
                name: "\u200b",
                value: "\u200b",
            })
            .addFields(
                {
                    name: "Место",
                    value: places,
                    inline: true,
                },
                {
                    name: "Имя",
                    value: players,
                    inline: true,
                },
                {
                    name: "DPS",
                    value: dps,
                    inline: true,
                }
            );

        if (bossThumbnails[dataBossKillInfo.boss_name] !== undefined) {
            embedMessage.setThumbnail(
                bossThumbnails[dataBossKillInfo.boss_name]
            );
        }

        if (lootHtml) {
            embedMessage
                .addFields({
                    name: "\u200b",
                    value: "\u200b",
                })
                .addFields({
                    name: "Лут: ",
                    value: "\u200b",
                    inline: false,
                });
            embedMessage.setImage("attachment://" + fileName + ".png");

            resolve({
                embeds: [embedMessage],
                files: [
                    {
                        attachment: "./images/" + fileName + ".png",
                        name: fileName + ".png",
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
            toolTipsItemApi + item.entry + `/${realm_id}`,
            { headers: { "accept-encoding": null }, cache: true }
        );
        return responseLoot.data.trim();
    } else {
        return "";
    }
}

async function takeSceenshot(html, fileName, lootCount) {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            lootCount > 4 ? "--window-size=1300,700" : "--window-size=800,600",
        ],
        defaultViewport: null,
    });

    const page = await browser.newPage();
    await page.setContent(html);
    await page.addStyleTag({ content: mainStyle });
    await page.addStyleTag({ content: otherStyle });
    await page.addStyleTag({ content: borderStyle });
    await page.screenshot({
        path: "images/" + fileName + ".png",
        fullPage: false,
        omitBackground: true,
    });

    await browser.close();
}

const easterEgg = ["Logrus", "Rozx"];

function parsePlayers(data) {
    const classEmojiFile = "./loot/classEmoji.json";
    let classEmoji = undefined;
    try {
        classEmoji = JSON.parse(fs.readFileSync(classEmojiFile, "utf8"));
    } catch (error) {
        console.error(error);
        console.log(`[WARNING] Can't load ${classEmojiFile}`);
    }

    data.sort((a, b) => b.dps - a.dps);

    let i = 1;
    let places = "";
    let players = "";
    let dps = "";
    let summaryDps = 0;

    for (const player of data) {
        places += `**${i++}**\n`;

        let emoji = undefined;
        try {
            if (easterEgg.find((item) => item === player.character.name)) {
                emoji = client.emojis.cache.get("1067786576639295488");
            } else if (classEmoji !== undefined) {
                emoji = client.emojis.cache.get(
                    classEmoji[player.character.class_id].spec[player.spec]
                        .emoji_id
                );
            }
        } catch (error) {
            console.error(error);
            console.log(
                `[WARNING] Can't get emoji for ${player.character.name}`
            );
        }

        players +=
            (emoji !== undefined ? `${emoji}` : "") +
            player.character.name +
            "\n";
        dps += player.dps + "\n";
        let dpsInt = parseInt(player.dps);
        summaryDps += dpsInt !== NaN ? dpsInt : 0;
    }

    return [places, players, dps, summaryDps];
}

module.exports = {
    init: init,
    setLootChannel: setLootChannel,
};
