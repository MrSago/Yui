const logger = require("../logger.js");

const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),

  async execute(interaction) {
    logger.info(
      `[${interaction.guild.name} (${interaction.guild.id})] [${interaction.user.tag}] ` +
        `Using command: /${interaction.commandName}`
    );
    await interaction.reply({ content: "Pong!", ephemeral: true });
  },
};
