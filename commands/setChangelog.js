const logger = require("../logger.js");
const { setChangelogChannel } = require("../db/db.js");

const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setchangelog")
    .setDescription("Установить канал для списка изменений Sirus.su")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Выберите канал")
        .setRequired(true)
    ),

  async execute(interaction) {
    const guild = interaction.guild;
    const guild_name = interaction.guild?.name ?? "USER";
    const guild_id = interaction.guild?.id ?? interaction.user.id;
    const user_tag = interaction.user.tag;
    const command_name = interaction.commandName;

    const channel = interaction.options.getChannel("channel");

    logger.info(
      `[${guild_name} (${guild_id})] [${user_tag}] ` +
        `Using command: /${command_name} ` +
        `[${channel.id}]`
    );

    if (!interaction.guild) {
      await interaction.reply({
        content:
          "Используйте эту комманду в текстовом канале Вашего дискорд сервера!",
        ephemeral: true,
      });
      return;
    }

    setChangelogChannel(guild.id, channel.id);

    await interaction.reply(`Канал ${channel} для списка изменений установлен`);
  },
};
