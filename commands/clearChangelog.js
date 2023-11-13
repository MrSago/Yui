const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { deleteChangelogChannel } = require("../db/db.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clearchangelog")
    .setDescription("Удалить настройки оповещений об изменениях Sirus.su")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const guild = interaction.guild;
    deleteChangelogChannel(guild.id);
    await interaction.reply(
      `Настройки оповещений об изменениях Sirus.su успешно сброшены!`
    );
  },
};
