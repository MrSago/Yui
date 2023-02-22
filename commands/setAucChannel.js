
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setAucChannel } = require('../auctionator.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setaucchannel')
        .setDescription('Установить канал для уведомлений бота')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Выберите канал')
                .setRequired(true)),

    async execute(interaction) {
        const guild = interaction.guild;
        const channel = interaction.options.getChannel('channel');
        setAucChannel(guild.id, channel.id);
        await interaction.reply(`Канал ${channel} для уведомлений бота установлен`);
    },
};
