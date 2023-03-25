const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
const puppeteer = require("puppeteer");
const fs = require("fs");

const latestFightsApi =
    "https://sirus.su/api/base/33/leader-board/bossfights/latest?realm=33";
const bossKillApi =
    "https://sirus.su/api/base/33/leader-board/bossfights/boss-kill/";

const settingsFile = "./loot/loot.json";

const tempPath = "./temp/";
const recordsFile = tempPath + "records.json";

const stylePath = "./styles/";
const mainStyleFile = stylePath + "main.css";
const otherStyleFile = stylePath + "other.css";

const intervalUpdate = 1000 * 60 * 5;

const bossThumbnails = {
    "Разрушитель XT-002":
        "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-xt-002-deconstructor.png",
    Фрея: "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-freya.png",
    Торим: "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-thorim.png",
    "Огненный Левиафан":
        "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-flame-leviathan.png",
    Мимирон: "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-mimiron.png",
    "Гидросс Нестабильный":
        "https://wow.zamimg.com/uploads/screenshots/small/30250.jpg",
    Острокрылая:
        "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-razorscale.png",
    "Повелитель Горнов Игнис":
        "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-ignis-the-furnace-master.png",
    Ходир: "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-hodir.png",
    Кологарн:
        "https://wow.zamimg.com/modelviewer/live/webthumbs/npc/222/28638.webp",
    "Йогг-Сарон":
        "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-yogg-saron.png",
    "Генерал Везакс":
        "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-general-vezax.png",
    "Железное Собрание":
        "https://wow.zamimg.com/uploads/screenshots/small/128853.jpg",
    Ауриайя: "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-auriaya.png",
    "Кель'тас Солнечный Скиталец":
        "https://wow.zamimg.com/uploads/screenshots/small/79291.jpg",
    "Повелитель глубин Каратресс":
        "https://wow.zamimg.com/uploads/screenshots/small/80609.jpg",
    "Ал'ар": "https://wow.zamimg.com/uploads/screenshots/small/29018.jpg",
    "Верховный звездочет Солариан":
        "https://wow.zamimg.com/uploads/screenshots/small/53912.jpg",
    "Страж Бездны":
        "https://wow.zamimg.com/uploads/screenshots/small/47202.jpg",
    "Леди Вайш": "https://wow.zamimg.com/uploads/screenshots/small/79290.jpg",
    "Морогрим Волноступ":
        "https://wow.zamimg.com/uploads/screenshots/small/28948.jpg",
    "Скрытень из глубин":
        "https://wow.zamimg.com/uploads/screenshots/small/81775.jpg",
    "Алгалон Наблюдатель":
        "https://wow.zamimg.com/uploads/screenshots/small/132856.jpg",
};

var client = undefined;
var settings = {};
var records = {};

var mainStyle = undefined;
var otherStyle = undefined;

function init(discord) {
    client = discord;

    loadSettings();
    loadRecords();
    loadStyles();

    refreshLoot();
}

function setLootChannel(guild_id, channel_id, guild_sirus_id) {
    if (settings[guild_id] === undefined) {
        settings[guild_id] = {};
    }
    settings[guild_id]["channel_id"] = channel_id;
    settings[guild_id]["guild_sirus_id"] = guild_sirus_id;
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

function loadRecords() {
    console.log(`[LOG] Load records from ${recordsFile}`);
    try {
        if (!fs.existsSync(tempPath)) {
            fs.mkdirSync(tempPath);
        }
        records = JSON.parse(fs.readFileSync(recordsFile, "utf8"));
        console.log(`[LOG] Records successfully loaded from ${recordsFile}`);
    } catch (error) {
        console.error(error);
        console.log(`[WARNING] Can't parse ${recordsFile}`);
    }
}

function loadStyles() {
    console.log(`[LOG] Load style from ${mainStyleFile}`);
    try {
        mainStyle = fs.readFileSync(mainStyleFile, "utf8");
        console.log(`[LOG] Style successfully loaded from ${mainStyleFile}`);
    } catch (error) {
        console.error(error);
        console.log(`[WARNING] Can't load ${mainStyleFile}`);
    }

    console.log(`[LOG] Load style from ${otherStyleFile}`);
    try {
        otherStyle = fs.readFileSync(otherStyleFile, "utf8");
        console.log(`[LOG] Style successfully loaded from ${otherStyleFile}`);
    } catch (error) {
        console.error(error);
        console.log(`[WARNING] Can't load ${otherStyleFile}`);
    }
}

async function refreshLoot() {
    axios
        .get(latestFightsApi, {
            headers: { "accept-encoding": null },
            cache: true,
        })
        .then(async (response) => {
            Promise.all(
                response.data.data.map(async (record) =>
                    getExtraInfoWrapper(record)
                )
            ).then(() => {
                fs.writeFileSync(
                    recordsFile,
                    JSON.stringify(records, null, 4),
                    "utf8"
                );
            });
        })
        .catch(console.error);

    getExtraInfo(774447)
        .then(async (message) => {
            client.channels.cache.get("1089077448429277204").send(message);
            //records[guild_id].push(record.id);
        })
        .catch(console.error);

    setTimeout(refreshLoot, intervalUpdate);
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
            await getExtraInfo(record.id)
                .then(async (message) => {
                    client.channels.cache.get(entry.channel_id).send(message);
                    records[guild_id].push(record.id);
                })
                .catch(console.error);
        }
    }
}

async function getExtraInfo(recordId) {
    return new Promise(async (resolve, reject) => {
        let fileName = [...Array(10)]
            .map((i) => (~~(Math.random() * 36)).toString(36))
            .join("");

        let responseBossKillInfo = await axios.get(bossKillApi + recordId, {
            headers: { "accept-encoding": null },
            cache: true,
        });
        let dataBossKillInfo = responseBossKillInfo.data;
        // console.log(dataBossKillInfo);

        let lootHtml = await Promise.all(
            dataBossKillInfo.data.loots.map((loot) => getLootInfo(loot.item))
        ).catch(console.error);

        let hasLootInfo = false;

        lootHtml = lootHtml.join().replaceAll(",", "");

        if (lootHtml) {
            let html =
                '<!doctype html> <html><body><div style="display: flex; justify-content: center;">';
            hasLootInfo = true;
            html += lootHtml + "</div></body></html>";
            await takeSceenshot(html, fileName);
        }

        let exampleEmbed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle("Упал босс " + dataBossKillInfo.data.boss_name)
            .setURL(
                "https://sirus.su/base/pve-progression/boss-kill/33/" + recordId
            )
            .addFields(
                {
                    name: "Попытки",
                    value: dataBossKillInfo.data.attempts.toString(),
                    inline: true,
                },
                {
                    name: "Когда убили",
                    value: dataBossKillInfo.data.killed_at,
                    inline: true,
                },
                {
                    name: "Время убийства",
                    value: dataBossKillInfo.data.fight_length,
                    inline: true,
                }
            );

        if (bossThumbnails[dataBossKillInfo.boss_name] !== undefined) {
            exampleEmbed.setThumbnail(
                bossThumbnails[dataBossKillInfo.boss_name]
            );
        }

        if (hasLootInfo) {
            exampleEmbed.addFields({
                name: "Лут: ",
                value: "\u200b",
                inline: false,
            });
            exampleEmbed.setImage("attachment://" + fileName + ".png");
            resolve({
                embeds: [exampleEmbed],
                files: [
                    {
                        attachment: "./images/" + fileName + ".png",
                        name: fileName + ".png",
                    },
                ],
            });
            // await channel.send();
        } else {
            resolve({ embeds: [exampleEmbed] });
            // await channel.send();
        }
    });
}

async function getLootInfo(item) {
    if (item.inventory_type && item.quality >= 4 && item.level >= 0) {
        let responseLoot = await fetch(
            "https://sirus.su/api/tooltips/item/" + item.entry + "/33"
        );
        let html = await responseLoot.text();
        return html.trim();
    } else {
        return "";
    }
}

takeSceenshot = async (html, fileName) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const options = {
        path: 'images/'+fileName+'.png',
        fullPage: false,
        omitBackground: true
    };
    await page.setContent(html)
    await page.addStyleTag({url: 'https://sirus.su/tooltips/tooltip.css?v=4'})
    await page.addStyleTag({url: 'https://sirus.su/css/app.css?v=c7bb00c8'})
    await page.addStyleTag({content: '.s-wow-tooltip-body{margin-right: 15px;margin-bottom: 15px;border: 1px solid #737373;padding: 10px;}.s-wow-tooltip-body:last-child{margin-right: 0px}'})
    await page.screenshot(options);
    await browser.close();
}

module.exports = {
    init: init,
    setLootChannel: setLootChannel,
};
