
require('./index.js');

const { Client, Events, GatewayIntentBits } = require('discord.js');
const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    prtials: ['MESSAGE']
});

require('dotenv').config();
client.login(process.env['token']);

client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});
