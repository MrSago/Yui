
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setLootChannel } = require('../loot.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlootchannel')
        .setDescription('Установить канал для вывода информации лута')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Выберите канал')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('guild_sirus_id')
                .setDescription('ID гильдии')
                .setRequired(true)),

    async execute(interaction) {
        const guild = interaction.guild;
        const channel = interaction.options.getChannel('channel');
        const guild_sirus_id = interaction.options.getInteger('guild_sirus_id');
        setLootChannel(guild.id, channel.id, guild_sirus_id);
        await interaction.reply(`Канал ${channel} для вывода информации лута установлен`);
    },
};
