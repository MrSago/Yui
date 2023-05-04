const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { clearLogChannel } = require("../changelog/changelog.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("clearlogchannel")
        .setDescription("Удалить настройки оповещений об изменениях Sirus.su")
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const guild = interaction.guild;
        clearLogChannel(guild.id);
        await interaction.reply(
            `Настройки оповещений об изменениях Sirus.su успешно сброшены!`
        );
    },
};
