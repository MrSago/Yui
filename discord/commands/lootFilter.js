/**
 * @file Loot filter UX command
 * @description Configures loot filters using interactive menus
 */

const {
  SlashCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const { buildLootFilterMessage } = require("../interactions/lootFilter.js");
const logger = require("../../logger.js").child({ module: "discord/commands/lootFilter" });

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lootfilter")
    .setDescription("Настроить фильтры для вывода лута")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  /**
   * Executes the lootfilter command
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
        `Using command: /${command_name}`,
    );

    if (!guild) {
      return interaction.reply({
        content:
          "Используйте эту команду в текстовом канале Вашего дискорд сервера!",
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
      const message = await buildLootFilterMessage({
        guildId: guild.id,
        userId: interaction.user.id,
      });

      return interaction.reply({
        ...message,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      logger.error({ err: error }, "Error preparing loot filter UI:");

      if (error.name === "LootSettingsNotFoundError") {
        return interaction.reply({
          content:
            "Настройки лута не найдены для этого сервера. Пожалуйста, настройте вывод лута с помощью команды /setloot.",
          flags: MessageFlags.Ephemeral,
        });
      }

      return interaction.reply({
        content: "Произошла внутренняя ошибка при настройке фильтров.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
