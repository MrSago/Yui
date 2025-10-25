/**
 * @file Interaction create event handler
 * @description Handles Discord slash command interactions
 */

const logger = require("../logger.js");

const { Events } = require("discord.js");

module.exports = {
  name: Events.InteractionCreate,
  once: false,

  /**
   * Executes when a user interacts with the bot
   * @param {import('discord.js').Interaction} interaction - Discord interaction object
   */
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(error);
      await interaction.reply({
        content: "Ошибка при выполнении команды!",
        ephemeral: true,
      });
    }
  },
};
