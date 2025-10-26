/**
 * @file Clear loot command
 * @description Removes loot notification settings for the guild
 */

const logger = require("../logger.js");
const { deleteLootChannel } = require("../db/database.js");

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clearloot")
    .setDescription("Удалить настройки оповещений об убийствах боссов")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  /**
   * Executes the clearloot command
   * @param {import('discord.js').CommandInteraction} interaction - Command interaction
   */
  async execute(interaction) {
    const guild = interaction.guild;
    const guild_name = interaction.guild?.name ?? "USER";
    const guild_id = interaction.guild?.id ?? interaction.user.id;
    const user_tag = interaction.user.tag;
    const command_name = interaction.commandName;

    logger.info(
      `[${guild_name} (${guild_id})] [${user_tag}] ` +
        `Using command: /${command_name} `
    );

    if (!interaction.guild) {
      await interaction.reply({
        content:
          "Используйте эту комманду в текстовом канале Вашего дискорд сервера!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    deleteLootChannel(guild.id);

    await interaction.reply(
      "Настройки оповещений об убийствах боссов успешно сброшены!"
    );
  },
};
