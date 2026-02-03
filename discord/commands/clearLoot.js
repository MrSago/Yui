/**
 * @file Clear loot command
 * @description Removes loot notification settings for the guild
 */

const {
  SlashCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const { deleteLootChannel } = require("../../db/database.js");
const logger = require("../../logger.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clearloot")
    .setDescription("Удалить настройки оповещений об убийствах боссов")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  /**
   * Executes the clearloot command
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
      await deleteLootChannel(guild.id);

      return interaction.reply("Настройки вывода лута успешно сброшены!");
    } catch (error) {
      logger.error(`Error clearing loot settings: ${error.message}`);

      return interaction.reply({
        content:
          "Произошла внутренняя ошибка при очистке настроек вывода лута.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
