/**
 * @file Set boss filter command
 * @description Configures boss filter for boss kill loot notifications
 */

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const { setBossFilter } = require("../../db/database.js");
const logger = require("../../logger.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setbossfilter")
    .setDescription("Установить фильтр боссов для вывода лута")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((option) =>
      option
        .setName("boss_ids")
        .setDescription("ID боссов через запятую (например: 15952,15953,15954)")
        .setRequired(true)
    ),

  /**
   * Executes the setbossfilter command
   * @param {import('discord.js').CommandInteraction} interaction - Command interaction
   */
  async execute(interaction) {
    const guild = interaction.guild;
    const guild_name = interaction.guild?.name ?? "USER";
    const guild_id = interaction.guild?.id ?? interaction.user.id;
    const user_tag = interaction.user.tag;
    const command_name = interaction.commandName;

    const bossIdsString = interaction.options.getString("boss_ids");

    logger.info(
      `[${guild_name} (${guild_id})] [${user_tag}] ` +
        `Using command: /${command_name} [${bossIdsString}]`
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
      // Parse boss IDs from string
      const bossIds = bossIdsString
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));

      if (bossIds.length === 0) {
        await interaction.reply({
          content: "Ошибка: не удалось распознать ID боссов!",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await setBossFilter(guild.id, bossIds);

      await interaction.reply(
        `Фильтр боссов установлен: ${bossIds.join(", ")}`
      );
    } catch (error) {
      logger.error(`Error setting boss filter: ${error.message}`);
      await interaction.reply({
        content: `Ошибка при установке фильтра: ${error.message}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
