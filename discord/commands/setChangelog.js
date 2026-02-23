/**
 * @file Set changelog command
 * @description Configures channel for Sirus.su changelog notifications
 */

const {
  SlashCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const {
  setChangelogChannel,
  deleteChangelogChannelByChannelId,
} = require("../../db/database.js");
const logger = require("../../logger.js").child({
  module: "discord/commands/setChangelog",
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setchangelog")
    .setDescription("Установить канал для списка изменений Sirus.su")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Выберите канал")
        .setRequired(true),
    ),

  /**
   * Executes the setchangelog command
   * @param {import('discord.js').CommandInteraction} interaction - Command interaction
   */
  async execute(interaction) {
    const guild = interaction.guild;
    const guild_name = guild?.name ?? "USER";
    const guild_id = guild?.id ?? interaction.user.id;
    const user_tag = interaction.user.tag;
    const command_name = interaction.commandName;

    const channel = interaction.options.getChannel("channel");

    logger.info(
      `[${guild_name} (${guild_id})] [${user_tag}] ` +
        `Using command: /${command_name} ` +
        `[${channel.id}]`,
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
      await deleteChangelogChannelByChannelId(channel.id);
      return interaction.reply({
        content:
          "Я не могу отправлять сообщения в выбранный канал. Настройка для этого канала удалена, укажите другой канал.",
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      await setChangelogChannel(guild.id, channel.id);

      return interaction.reply(
        `Канал ${channel} для списка изменений Sirus.su установлен.`,
      );
    } catch (error) {
      logger.error({ err: error }, "Error setting changelog channel:");

      return interaction.reply({
        content: `Произошла внутренняя ошибка при установке настроек об изменениях Sirus.su.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
