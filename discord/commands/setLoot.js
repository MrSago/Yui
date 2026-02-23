/**
 * @file Set loot command
 * @description Configures channel for boss kill loot notifications
 */

const {
  SlashCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const { setLootChannel, deleteLootChannelByChannelId } = require("../../db/database.js");
const logger = require("../../logger.js").child({ module: "discord/commands/setLoot" });

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setloot")
    .setDescription("Установить канал для вывода информации лута")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Выберите канал")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("realm_id")
        .setDescription("Выберите реалм")
        .setRequired(true)
        .setChoices(
          { name: "Scourge x2", value: 9 },
          { name: "Neverest x3", value: 22 },
          { name: "Soulseeker x1", value: 42 },
          { name: "Sirus x5", value: 57 },
        ),
    )
    .addIntegerOption((option) =>
      option
        .setName("guild_sirus_id")
        .setDescription("ID гильдии")
        .setRequired(true),
    ),

  /**
   * Executes the setloot command
   * @param {import('discord.js').CommandInteraction} interaction - Command interaction
   */
  async execute(interaction) {
    const guild = interaction.guild;
    const guild_name = guild?.name ?? "USER";
    const guild_id = guild?.id ?? interaction.user.id;
    const user_tag = interaction.user.tag;
    const command_name = interaction.commandName;

    const channel = interaction.options.getChannel("channel");
    const realm_id = interaction.options.getInteger("realm_id");
    const guild_sirus_id = interaction.options.getInteger("guild_sirus_id");

    logger.info(
      `[${guild_name} (${guild_id})] [${user_tag}] ` +
        `Using command: /${command_name} ` +
        `[${channel.id}] [${realm_id}] [${guild_sirus_id}]`,
    );

    if (!guild) {
      return interaction.reply({
        content:
          "Используйте эту комманду в текстовом канале Вашего дискорд сервера!",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({
        content: "У вас нет прав на использование этой команды.",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (!channel?.isTextBased?.()) {
      return interaction.reply({
        content:
          "Выбранный канал не подходит для отправки сообщений. Укажите текстовый канал.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const botPermissions = channel.permissionsFor(interaction.client.user);
    const hasSendPermissions =
      botPermissions?.has(PermissionFlagsBits.ViewChannel) &&
      botPermissions?.has(PermissionFlagsBits.SendMessages) &&
      botPermissions?.has(PermissionFlagsBits.EmbedLinks);

    if (!hasSendPermissions) {
      await deleteLootChannelByChannelId(channel.id);
      return interaction.reply({
        content:
          "Я не могу отправлять сообщения в выбранный канал. Настройка для этого канала удалена, укажите другой канал.",
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      await setLootChannel(guild.id, channel.id, realm_id, guild_sirus_id);

      return interaction.reply(
        `Канал ${channel} для вывода информации лута установлен.`,
      );
    } catch (error) {
      logger.error({ err: error }, "Error setting loot channel:");

      return interaction.reply({
        content: `Произошла внутренняя ошибка при установке настроек вывода лута.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
