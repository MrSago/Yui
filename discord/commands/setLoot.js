/**
 * @file Set loot command
 * @description Configures channel for boss kill loot notifications
 */

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const { setLootChannel } = require("../../db/database.js");
const logger = require("../../logger.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setloot")
    .setDescription("Установить канал для вывода информации лута")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Выберите канал")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("realm_id")
        .setDescription("Выберите реалм")
        .setRequired(true)
        .setChoices(
          { name: "Scourge x2", value: 9 },
          { name: "Neverest x3", value: 22 },
          { name: "Algalon x4", value: 33 },
          { name: "Soulseeker x1", value: 42 },
          { name: "Sirus x5", value: 57 }
        )
    )
    .addIntegerOption((option) =>
      option
        .setName("guild_sirus_id")
        .setDescription("ID гильдии")
        .setRequired(true)
    ),

  /**
   * Executes the setloot command
   * @param {import('discord.js').CommandInteraction} interaction - Command interaction
   */
  async execute(interaction) {
    const guild = interaction.guild;
    const guild_name = interaction.guild?.name ?? "USER";
    const guild_id = interaction.guild?.id ?? interaction.user.id;
    const user_tag = interaction.user.tag;
    const command_name = interaction.commandName;

    const channel = interaction.options.getChannel("channel");
    const realm_id = interaction.options.getInteger("realm_id");
    const guild_sirus_id = interaction.options.getInteger("guild_sirus_id");

    logger.info(
      `[${guild_name} (${guild_id})] [${user_tag}] ` +
        `Using command: /${command_name} ` +
        `[${channel.id}] [${realm_id}] [${guild_sirus_id}]`
    );

    if (!interaction.guild) {
      await interaction.reply({
        content:
          "Используйте эту комманду в текстовом канале Вашего дискорд сервера!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    setLootChannel(guild.id, channel.id, realm_id, guild_sirus_id);

    await interaction.reply(
      `Канал ${channel} для вывода информации лута установлен`
    );
  },
};
