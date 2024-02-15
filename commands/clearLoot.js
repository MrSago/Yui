const logger = require("../logger.js");
const { deleteLootChannel } = require("../db/db.js");

const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clearloot")
    .setDescription("Удалить настройки оповещений об убийствах боссов")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const guild = interaction.guild;
    logger.info(
      `[${interaction.guild.name} (${interaction.guild.id})] [${interaction.user.tag}] ` +
        `Using command: /${interaction.commandName}`
    );
    deleteLootChannel(guild.id);
    await interaction.reply(
      `Настройки оповещений об убийствах боссов успешно сброшены!`
    );
  },
};
