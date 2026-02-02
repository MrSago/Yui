/**
 * @file Add dungeon filter command
 * @description Configures dungeon filter for boss kill loot notifications
 */

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const { addLootFilter } = require("../../db/database.js");
const logger = require("../../logger.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addlootfilter")
    .setDescription("Добавить фильтр подземелий для вывода лута")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addIntegerOption((option) =>
      option
        .setName("map_id")
        .setDescription("ID подземелья")
        .setMinValue(1)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("encounter_id")
        .setDescription(
          "ID энкаунтеров через запятую (оставьте пустым для всех энкаунтеров)",
        )
        .setRequired(false),
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

    const map_id = interaction.options.getInteger("map_id");
    const encounter_ids_string = interaction.options.getString("encounter_id");

    logger.info(
      `[${guild_name} (${guild_id})] [${user_tag}] ` +
        `Using command: /${command_name} [${map_id}, ${encounter_ids_string}]`,
    );

    if (!interaction.guild) {
      await interaction.reply({
        content:
          "Используйте эту команду в текстовом канале Вашего дискорд сервера!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const encounters_id =
      encounter_ids_string
        ?.split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id)) ?? [];

    if (encounter_ids_string && encounters_id.length === 0) {
      await interaction.reply({
        content: "Ошибка: не удалось распознать ID энкаунтеров!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      const settings = await addLootFilter(guild.id, {
        [String(map_id)]: encounters_id || [],
      });
      logger.debug(`Updated filters: ${JSON.stringify(settings.filter)}`);

      const filterValues = settings.filter.get(String(map_id)) || [];
      await interaction.reply(
        `Фильтр для подземелья ${map_id} успешно добавлен!\n` +
          `Текущие энкаунтеры: ${filterValues.length > 0 ? filterValues.join(", ") : "Все энкаунтеры"}`,
      );
    } catch (error) {
      if (error.name === "LootSettingsNotFoundError") {
        await interaction.reply({
          content:
            "Настройки лута не найдены для этого сервера. Пожалуйста, настройте вывод лута с помощью команды /setloot.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      logger.error(`Error setting loot filter: ${error.message}`);
      await interaction.reply({
        content: "Произошла внутренняя ошибка при установке фильтра.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
