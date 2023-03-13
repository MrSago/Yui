const axios = require("axios");
const fs = require("fs");
const { EmbedBuilder } = require("discord.js");

const baseUrl = "https://www.sirus.su";
const apiItemPath = "/api/base/item/";

const settingsPath = "./settings/";
const settingsFile = settingsPath + "auctionator.json";

const delay = 1000 * 60 * 5;

const realmIdString = {
    9: "Scourge x2",
    33: "Algalon x4",
    57: "Sirus x5",
};

var itemsBase = {};
var bot = undefined;

function initAuctionator(client) {
    bot = client;

    console.log(`[LOG] Load settings from ${settingsFile}`);
    if (!fs.existsSync(settingsPath)) {
        fs.mkdirSync(settingsPath);
    }
    try {
        itemsBase = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
        console.log(`[LOG] Settings successfully loaded from ${settingsFile}`);
    } catch (error) {
        console.error(error);
        console.log(`[WARNING] Can't parse ${settingsFile}`);
    }

    setInterval(async () => {
        var dateGetterPromises = [];
        Object.entries(itemsBase).forEach((guild_id, guild) => {
            Object.entries(guild).forEach((realm_id, realm) => {
                if (realm_id === "channel_id") return;

                Object.keys(realm).forEach((item_id) => {
                    dateGetterPromises.push(async () =>
                        getDataItem(realm_id, item_id)
                            .then((data) => {
                                itemsBase[guild_id][realm_id][item_id] =
                                    parseData(data);
                            })
                            .catch(() => {})
                    );
                });
            });
        });
        Promise.all(dateGetterPromises).then(() => {
            if (!fs.existsSync(settingsPath)) {
                fs.mkdirSync(settingsPath);
            }
            fs.writeFileSync(
                settingsFile,
                JSON.stringify(itemsBase, null, 4),
                "utf8"
            );
        });
    }, 120000);

    updateEmbed();
}

async function updateEmbed() {
    for (const guild_id in itemsBase) {
        const channel_id = itemsBase[guild_id].channel_id;
        if (channel_id === undefined) {
            continue;
        }

        const embedMessage = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle("Сводка аукциона")
            .setDescription(
                `Последнее обновление: ${new Date().toLocaleTimeString()}`
            );

        const count = Object.keys(itemsBase[guild_id]).length;
        let index = 0;
        for (const realm_id in itemsBase[guild_id]) {
            index += 1;
            if (realm_id === "channel_id") {
                continue;
            }

            let item_string = "";
            let item_price = "";
            for (const item_id in itemsBase[guild_id][realm_id]) {
                item_string +=
                    itemsBase[guild_id][realm_id][item_id].name + "\n";
                item_price +=
                    itemsBase[guild_id][realm_id][item_id].price + "\n";
            }

            try {
                embedMessage.addFields(
                    {
                        name: realmIdToString(realm_id),
                        value: item_string,
                        inline: true,
                    },
                    {
                        name: "Средняя цена",
                        value: item_price,
                        inline: true,
                    }
                );
                if (index < count - 1) {
                    embedMessage.addFields({
                        name: "\u200B",
                        value: "\u200B",
                    });
                }
            } catch (error) {
                return;
            }
        }

        try {
            const channel = bot.channels.cache.get(channel_id);
            await channel.messages
                .fetch({
                    limit: 1,
                })
                .then((messages) => {
                    let lastMessage = messages.first();
                    if (lastMessage.author.id === bot.user.id) {
                        lastMessage.edit({
                            embeds: [embedMessage],
                        });
                    } else {
                        channel.send({
                            embeds: [embedMessage],
                        });
                    }
                });
        } catch (error) {}
    }

    setTimeout(updateEmbed, delay);
}

function getChannelId(guild_id) {
    if (itemsBase[guild_id] === undefined) {
        itemsBase[guild_id] = {};
        return undefined;
    }
    if (itemsBase[guild_id].channel_id === undefined) {
        return undefined;
    }
    return itemsBase[guild_id].channel_id;
}

function realmIdToString(realm_id) {
    if (realm_id in realmIdString) {
        return realmIdString[realm_id];
    }
    return "";
}

async function setAucChannel(guild_id, channel_id) {
    if (itemsBase[guild_id] === undefined) {
        itemsBase[guild_id] = {};
    }
    itemsBase[guild_id].channel_id = channel_id;
}

async function addItem(guild_id, realm_id, item_id) {
    if (itemsBase[guild_id] === undefined) {
        itemsBase[guild_id] = {};
    }
    if (itemsBase[guild_id][realm_id] === undefined) {
        itemsBase[guild_id][realm_id] = {};
    }

    const data = await getDataItem(realm_id, item_id);
    console.log(data);
    if (!data) {
        return undefined;
    }
    const parsed = parseData(data);
    itemsBase[guild_id][realm_id][item_id] = parsed;
    return parsed;
}

async function getDataItem(realm_id, item_id) {
    const itemUrl = baseUrl + apiItemPath + item_id + "/" + realm_id;
    return await axios
        .get(itemUrl, {
            headers: {
                "accept-encoding": null,
            },
            cache: true,
        })
        .then((response) => response.data)
        .catch(() => {});
}

function parseData(data) {
    let name = data["item"]["name"];
    let price = undefined;

    try {
        price = (
            Math.round(data["auctionhouse"]["avg"] / 100) / 100
        ).toString();
    } catch {
        console.log(
            `[WARNING] No data from auction for item ${name} (${data["item"]["entry"]})`
        );
        price = "Not available";
    }

    return { name: name, price: price };
}

module.exports = {
    initAuctionator: initAuctionator,
    updateEmbed: updateEmbed,
    getChannelId: getChannelId,
    realmIdToString: realmIdToString,
    setAucChannel: setAucChannel,
    addItem: addItem,
};
