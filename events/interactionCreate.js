const logger = require("../logger.js");

const { Events } = require("discord.js");

module.exports = {
  name: Events.InteractionCreate,
  once: false,

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
