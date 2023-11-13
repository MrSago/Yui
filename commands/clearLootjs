const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { deleteLootChannel } = require("../db/db.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clearloot")
    .setDescription("Удалить настройки оповещений об убийствах боссов")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const guild = interaction.guild;
    deleteLootChannel(guild.id);
    await interaction.reply(
      `Настройки оповещений об убийствах боссов успешно сброшены!`
    );
  },
};
