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

    deleteLootChannel(guild.id);

    await interaction.reply(
      `Настройки оповещений об убийствах боссов успешно сброшены!`
    );
  },
};
