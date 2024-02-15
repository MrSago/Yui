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
    const channel = interaction.options.getChannel("channel");
    logger.info(
      `[${interaction.guild.name} (${interaction.guild.id})] [${interaction.user.tag}] ` +
        `Using command: /${interaction.commandName} ` +
        `[${channel.id}]`
    );
    setChangelogChannel(guild.id, channel.id);
    await interaction.reply(`Канал ${channel} для списка изменений установлен`);
  },
};
