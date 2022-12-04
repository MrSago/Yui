
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setAucChannel } = require('../auctionator.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setaucchannel')
		.setDescription('Set discord channel for auction\'s notifications')
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('Channel to set for auction\'s notifications')
				.setRequired(true)),

	async execute(interaction) {
		const guild = interaction.guild;
		const channel = interaction.options.getChannel('channel');
		setAucChannel(guild.id, channel.id);
		await interaction.reply(`Channel ${channel} is set for auction\'s notifications`);
	},
};
