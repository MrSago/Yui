/**
 * @file Config command
 * @description Opens unified interactive bot configuration panel
 */

const {
  SlashCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const { openConfigPanel } = require("../interactions/configPanel.js");
const logger = require("../../logger.js").child({
  module: "discord/commands/config",
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Единое меню настройки бота")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  /**
   * Executes the config command
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const guild = interaction.guild;
    const guildName = guild?.name ?? "USER";
    const guildId = guild?.id ?? interaction.user.id;
    const userTag = interaction.user.tag;

    logger.info(
      `[${guildName} (${guildId})] [${userTag}] Using command: /config`,
    );

    try {
      await openConfigPanel(interaction);
    } catch (error) {
      logger.error({ err: error }, "Error opening /config panel:");

      if (interaction.replied || interaction.deferred) {
        return interaction.followUp({
          content:
            "Произошла внутренняя ошибка при открытии меню конфигурации.",
          flags: MessageFlags.Ephemeral,
        });
      }

      return interaction.reply({
        content: "Произошла внутренняя ошибка при открытии меню конфигурации.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
