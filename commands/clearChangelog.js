const logger = require("../logger.js");
const { deleteChangelogChannel } = require("../db/db.js");

const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clearchangelog")
    .setDescription("Удалить настройки оповещений об изменениях Sirus.su")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const guild = interaction.guild;
    logger.info(
      `[${interaction.guild.name} (${interaction.guild.id})] [${interaction.user.tag}] ` +
        `Using command: /${interaction.commandName}`
    );
    deleteChangelogChannel(guild.id);
    await interaction.reply(
      `Настройки оповещений об изменениях Sirus.su успешно сброшены!`
    );
  },
};
