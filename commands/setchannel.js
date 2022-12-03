


const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setchannel')
		.setDescription('Set channel for auction information'),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};
