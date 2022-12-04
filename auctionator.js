
const axios = require('axios');
const fs = require('fs');

const baseUrl = 'https://www.sirus.su';
const apiItemPath = '/api/base/item/';

const settingsPath = './settings/';
const settingsFile = settingsPath + 'auctionator.json';

const realmIdString = {
    9: "Scourge x2",
    33: "Algalon x4",
    57: "Sirus x5"
};

var itemsBase = {};

setInterval(async () => {
    if (!fs.existsSync(settingsPath)) {
        fs.mkdirSync(settingsPath);
    }
    fs.writeFileSync(settingsFile, JSON.stringify(itemsBase, null, 4), 'utf8');
}, 60000);

if (!fs.existsSync(settingsPath)) {
    fs.mkdirSync(settingsPath);
}
try {
    itemsBase = JSON.parse(fs.readFileSync(settingsFile, 'utf8'))
} catch (error) {
    console.error(`[ERROR] ${error.message}`);
    console.error(`[WARNING] Can't parse ${settingsFile}`);
}

function setAucChannel(guild_id, channel_id) {
    if (itemsBase[guild_id] === undefined) {
        itemsBase[guild_id] = {};
    }
    itemsBase[guild_id]['channel_id'] = channel_id;
}

function realmIdToString(realm_id) {
    if (realm_id in realmIdString) {
        return realmIdString[realm_id];
    }
    return "";
}

async function addItem(guild_id, realm_id, item_id) {
    const itemUrl = baseUrl + apiItemPath + item_id + '/' + realm_id;

    let data = undefined;
    await axios.get(itemUrl, {
        headers: { 'accept-encoding': null },
        cache: true
    }).then(response => {
        data = response.data;
    }).catch(error => {
        const throwMsg = `Item id ${item_id} from realm ${realmIdToString(realm_id)} not found in data base`;
        // console.error(`[ERROR] ${error}`);
        // console.error(`[WARNING] ${throwMsg}`)
        throw new Error(throwMsg);
    });

    let name = data['item']['name'];
    let price = undefined;
    try {
        price = (Math.round(data['auctionhouse']['avg'] / 100) / 100).toString();
    } catch {
        // console.error(`[WARNING] No data from auction for item ${name} (${item_id})`);
        price = 'Not available';
    }

    if (itemsBase[guild_id] === undefined) {
        itemsBase[guild_id] = {};
    }
    if (itemsBase[guild_id][realm_id] === undefined) {
        itemsBase[guild_id][realm_id] = {};
    }

    itemsBase[guild_id][realm_id][item_id] = {
        'name': name,
        'price': price
    };

    return itemsBase[guild_id];
}


module.exports = {
    realmIdToString: realmIdToString,
    setAucChannel: setAucChannel,
    addItem: addItem
};
