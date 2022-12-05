
require('dotenv').config();
const token = process.env['token'];
const client_id = process.env['client_id'];

const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, REST, Collection, Routes } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
    partials: ['MESSAGE', 'GUILDS']
});
const rest = new REST({ version: '10' }).setToken(token);

const commands = [];
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if (!('data' in command) || !('execute' in command)) {
        console.log(`[WARNING] The command at "${file}" is missing a required "data" or "execute" property`);
        continue;
    }

    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
    console.log(`[LOG] The command at "${file}" is registered`);
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (!('name' in event) || !('once' in event)) {
        console.log(`[WARNING] The event at "${file}" is missing a "name" or "once" property`);
        continue;
    }

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
    console.log(`[LOG] The event at "${file}" is registered`);
}

(async () => {
    try {
        console.log(`[LOG] Started refreshing ${commands.length} application (/) commands`);

        const data = await rest.put(
            Routes.applicationCommands(client_id),
            { body: commands },
        );

        console.log(`[LOG] Successfully reloaded ${data.length} application (/) commands`);
    } catch (error) {
        console.error(error);
    }
})();

client.login(token);


module.exports = {
    bot: client
};

