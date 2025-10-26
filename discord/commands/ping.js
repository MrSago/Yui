/**
 * @file Ping command
 * @description Simple ping-pong command for testing bot responsiveness
 */

const logger = require("../../logger.js");

const { SlashCommandBuilder, MessageFlags } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),

  /**
   * Executes the ping command
   * @param {import('discord.js').CommandInteraction} interaction - Command interaction
   */
  async execute(interaction) {
    const guild_name = interaction.guild?.name ?? "USER";
    const guild_id = interaction.guild?.id ?? interaction.user.id;
    const user_tag = interaction.user.tag;
    const command_name = interaction.commandName;

    logger.info(
      `[${guild_name} (${guild_id})] [${user_tag}] ` +
        `Using command: /${command_name}`
    );

    await interaction.reply({
      content: "Pong!",
      flags: MessageFlags.Ephemeral,
    });
  },
};
