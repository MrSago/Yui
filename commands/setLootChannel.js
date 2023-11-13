const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { setLootChannel } = require("../db/db.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setlootchannel")
    .setDescription("Установить канал для вывода информации лута")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Выберите канал")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("realm_id")
        .setDescription("Выберите реалм")
        .setRequired(true)
        .setChoices(
          { name: "Scourge x2", value: 9 },
          { name: "Algalon x4", value: 33 },
          { name: "Soulseeker x1", value: 42 },
          { name: "Sirus x5", value: 57 }
        )
    )
    .addIntegerOption((option) =>
      option
        .setName("guild_sirus_id")
        .setDescription("ID гильдии")
        .setRequired(true)
    ),

  async execute(interaction) {
    const guild = interaction.guild;
    const channel = interaction.options.getChannel("channel");
    const realm_id = interaction.options.getInteger("realm_id");
    const guild_sirus_id = interaction.options.getInteger("guild_sirus_id");
    setLootChannel(guild.id, channel.id, realm_id, guild_sirus_id);
    await interaction.reply(
      `Канал ${channel} для вывода информации лута установлен`
    );
  },
};
