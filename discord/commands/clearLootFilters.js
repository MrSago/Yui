/**
 * @file Clear filters command
 * @description Clears dungeon and boss filters for loot notifications
 */

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const { clearLootFilters } = require("../../db/database.js");
const logger = require("../../logger.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clearfilters")
    .setDescription("Очистить все фильтры для вывода лута")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  /**
   * Executes the clearfilters command
   * @param {import('discord.js').CommandInteraction} interaction - Command interaction
   */
  async execute(interaction) {
    const guild = interaction.guild;
    const guild_name = interaction.guild?.name ?? "USER";
    const guild_id = interaction.guild?.id ?? interaction.user.id;
    const user_tag = interaction.user.tag;
    const command_name = interaction.commandName;

    logger.info(
      `[${guild_name} (${guild_id})] [${user_tag}] ` +
        `Using command: /${command_name}`,
    );

    if (!interaction.guild) {
      await interaction.reply({
        content:
          "Используйте эту команду в текстовом канале Вашего дискорд сервера!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      await clearLootFilters(guild.id);
      await interaction.reply("Все фильтры очищены успешно!");
    } catch (error) {
      logger.error(`Error clearing filters: ${error.message}`);

      if (error.name === "LootSettingsNotFoundError") {
        await interaction.reply({
          content: `Настройки лута не найдены для этого сервера.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.reply({
        content: `Ошибка при очистке фильтров: ${error.message}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
