/**
 * @file Roll command
 * @description Dice rolling command with customizable range
 */

const { SlashCommandBuilder } = require("discord.js");

const logger = require("../../logger.js").child({
  module: "discord/commands/roll",
});
const { randInt } = require("../../utils/index.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roll")
    .setDescription("Бросить кости")
    .addIntegerOption((option) =>
      option
        .setName("start")
        .setDescription("Начальное число (по умолчанию 1)")
        .setRequired(false)
        .setMinValue(1),
    )
    .addIntegerOption((option) =>
      option
        .setName("end")
        .setDescription("Конечное число (по умолчанию 100)")
        .setRequired(false)
        .setMinValue(1),
    ),

  /**
   * Executes the roll command
   * @param {import('discord.js').CommandInteraction} interaction - Command interaction
   */
  async execute(interaction) {
    const guild_name = interaction.guild?.name ?? "USER";
    const guild_id = interaction.guild?.id ?? interaction.user.id;
    const user_tag = interaction.user.tag;
    const command_name = interaction.commandName;

    logger.info(
      `[${guild_name} (${guild_id})] [${user_tag}] ` +
        `Using command: /${command_name}`,
    );

    const start = interaction.options.getInteger("start");
    const end = interaction.options.getInteger("end");

    const min = Math.min(start ?? 1, end ?? 100);
    const max = Math.max(start ?? 1, end ?? 100);

    const result = min + randInt(max - min + 1);

    const emoji = result === Math.max(start ?? 1, end ?? 100) ? "🔥" : "🎲";

    return interaction.reply({
      content: `${emoji} Результат броска: **${result}**`,
    });
  },
};
