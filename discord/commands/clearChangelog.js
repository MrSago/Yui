/**
 * @file Clear changelog command
 * @description Removes changelog notification settings for the guild
 */

const {
  SlashCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const { deleteChangelogChannel } = require("../../db/database.js");
const logger = require("../../logger.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clearchangelog")
    .setDescription("Удалить настройки оповещений об изменениях Sirus.su")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  /**
   * Executes the clearchangelog command
   * @param {import('discord.js').CommandInteraction} interaction - Command interaction
   */
  async execute(interaction) {
    const guild = interaction.guild;
    const guild_name = guild?.name ?? "USER";
    const guild_id = guild?.id ?? interaction.user.id;
    const user_tag = interaction.user.tag;
    const command_name = interaction.commandName;

    logger.info(
      `[${guild_name} (${guild_id})] [${user_tag}] ` +
        `Using command: /${command_name} `,
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

    try {
      await deleteChangelogChannel(guild.id);

      return interaction.reply(
        "Настройки оповещений об изменениях Sirus.su успешно сброшены!",
      );
    } catch (error) {
      logger.error(`Error clearing changelog settings: ${error.message}`);

      return interaction.reply({
        content:
          "Произошла внутренняя ошибка при очистке настроек об изменениях Sirus.su.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
