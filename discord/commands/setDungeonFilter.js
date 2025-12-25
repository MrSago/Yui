/**
 * @file Set dungeon filter command
 * @description Configures dungeon filter for boss kill loot notifications
 */

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const { setDungeonFilter } = require("../../db/database.js");
const logger = require("../../logger.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setdungeonfilter")
    .setDescription("Установить фильтр подземелий для вывода лута")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((option) =>
      option
        .setName("dungeon_ids")
        .setDescription("ID подземелий через запятую (например: 533,532,615)")
        .setRequired(true)
    ),

  /**
   * Executes the setdungeonfilter command
   * @param {import('discord.js').CommandInteraction} interaction - Command interaction
   */
  async execute(interaction) {
    const guild = interaction.guild;
    const guild_name = interaction.guild?.name ?? "USER";
    const guild_id = interaction.guild?.id ?? interaction.user.id;
    const user_tag = interaction.user.tag;
    const command_name = interaction.commandName;

    const dungeonIdsString = interaction.options.getString("dungeon_ids");

    logger.info(
      `[${guild_name} (${guild_id})] [${user_tag}] ` +
        `Using command: /${command_name} [${dungeonIdsString}]`
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
      // Parse dungeon IDs from string
      const dungeonIds = dungeonIdsString
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));

      if (dungeonIds.length === 0) {
        await interaction.reply({
          content: "Ошибка: не удалось распознать ID подземелий!",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await setDungeonFilter(guild.id, dungeonIds);

      await interaction.reply(
        `Фильтр подземелий установлен: ${dungeonIds.join(", ")}`
      );
    } catch (error) {
      logger.error(`Error setting dungeon filter: ${error.message}`);
      await interaction.reply({
        content: `Ошибка при установке фильтра: ${error.message}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
