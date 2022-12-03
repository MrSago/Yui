
const axios = require('axios');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const baseUrl = 'https://sirus.su/base/item/';
const realmIds = {
    'x2': '9',
    'x4': '33',
    'x5': '57'
};

var items = [];

function getItemUrl(id, realm) {
    try {
        id = id.toString();
        realm = realmIds[realm];
    } catch (error) {
        console.error(`[ERROR] ${error}`);
        return null;
    }
    const itemUrl = baseUrl + id + '/' + realm;
    return itemUrl;
}



async function addItem(id, realm) {
    const item = getItemUrl(id, realm);
    console.log(`[LOG] ${item}`);

    axios.get({
        url: item,
        Referer: item,
        'X-Requested-With': 'XMLHttpRequest'
    }).then(response => {
        const dom = new JSDOM(response.data);
        console.log(response.data);
        console.log(dom.window.document.querySelector('moneygold').textContent)
    }).catch(error => {
        console.log(`[ERROR] ${error}`);
    });
};


addItem(52177, 'x4');

