
require('dotenv').config();
const token = process.env['token'];
const client_id = process.env['client_id'];

const fs = require('node:fs');
const { Client, GatewayIntentBits, REST, Collection, Routes, Events } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    partials: ['MESSAGE']
});
const rest = new REST({ version: '10' }).setToken(token);

client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.commands = new Collection();
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
		client.commands.set(command.data.name, command);
        console.log(`[LOG] The command at ${file} is registered`);
	} else {
		console.error(`[WARNING] The command at ${file} is missing a required "data" or "execute" property.`);
	}

}

(async () => {
    try {
        console.log(`[LOG] Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationCommands(client_id),
            { body: commands },
        );

        console.log(`[LOG] Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`[WARNING] No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});


module.exports = {
    client: client
};
