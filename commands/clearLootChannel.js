const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { clearLootChannel } = require("../loot/loot.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clearlootchannel")
    .setDescription("Удалить настройки оповещений об убийствах боссов")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const guild = interaction.guild;
    clearLootChannel(guild.id);
    await interaction.reply(
      `Настройки оповещений об убийствах боссов успешно сброшены!`
    );
  },
};
