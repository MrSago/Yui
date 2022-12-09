
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setLogChannel } = require('../changelog.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlogchannel')
        .setDescription('Установить канал для списка изменений')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Выберите канал')
                .setRequired(true)),

    async execute(interaction) {
        const guild = interaction.guild;
        const channel = interaction.options.getChannel('channel');
        setLogChannel(guild.id, channel.id);
        await interaction.reply(`Канал ${channel} для списка изменений установлен`);
    },
};

