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
    const guild_name = interaction.guild?.name ?? "USER";
    const guild_id = interaction.guild?.id ?? interaction.user.id;
    const user_tag = interaction.user.tag;
    const command_name = interaction.commandName;

    logger.info(
      `[${guild_name} (${guild_id})] [${user_tag}] ` +
        `Using command: /${command_name} `
    );

    if (!interaction.guild) {
      await interaction.reply({
        content:
          "Используйте эту комманду в текстовом канале Вашего дискорд сервера!",
        ephemeral: true,
      });
      return;
    }

    deleteChangelogChannel(guild.id);

    await interaction.reply(
      `Настройки оповещений об изменениях Sirus.su успешно сброшены!`
    );
  },
};
