const logger = require("../logger.js");
const { randInt } = require("../tools.js");

const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roll")
    .setDescription("Roll the dice")
    .addIntegerOption((option) =>
      option
        .setName("start")
        .setDescription("Start number")
        .setRequired(false)
        .setMinValue(1)
    )
    .addIntegerOption((option) =>
      option
        .setName("end")
        .setDescription("End number")
        .setRequired(false)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const guild_name = interaction.guild?.name ?? "USER";
    const guild_id = interaction.guild?.id ?? interaction.user.id;
    const user_tag = interaction.user.tag;
    const command_name = interaction.commandName;

    logger.info(
      `[${guild_name} (${guild_id})] [${user_tag}] ` +
        `Using command: /${command_name}`
    );

    const start = interaction.options.getInteger("start");
    const end = interaction.options.getInteger("end");

    let result;

    if (start && !end) {
      result = 1 + randInt(start);
    } else if (!start && end) {
      result = 1 + randInt(end);
    } else if (start && end) {
      result = Math.min(start, end) + randInt(Math.abs(start - end) + 1);
    } else {
      result = 1 + randInt(99);
    }

    await interaction.reply({ content: `Rolls: ${result}`, ephemeral: false });
  },
};
