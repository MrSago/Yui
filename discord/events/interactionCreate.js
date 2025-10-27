/**
 * @file Interaction create event handler
 * @description Handles Discord slash command interactions
 */

const logger = require("../../logger.js");

const { Events, MessageFlags } = require("discord.js");

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

    const guild_name = interaction.guild?.name ?? "DM";
    const guild_id = interaction.guild?.id ?? "N/A";
    const user_tag = interaction.user.tag;
    const user_id = interaction.user.id;
    const command_name = interaction.commandName;

    const options = interaction.options.data
      .map((opt) => `${opt.name}=${opt.value}`)
      .join(", ");

    const optionsStr = options ? ` [${options}]` : "";

    logger.discord(
      `🔧 Command: /${command_name}${optionsStr} | ` +
        `User: ${user_tag} (${user_id}) | ` +
        `Server: ${guild_name} (${guild_id})`
    );

    try {
      await command.execute(interaction);
      logger.info(
        `[${guild_name} (${guild_id})] [${user_tag}] ` +
          `Command /${command_name} executed successfully`
      );
    } catch (error) {
      logger.error(
        `Error executing command /${command_name} by ${user_tag} in ${guild_name}: ${error.message}`
      );
      logger.error(error);
      await interaction.reply({
        content: "Ошибка при выполнении команды!",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
