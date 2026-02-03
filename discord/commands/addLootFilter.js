// /**
//  * @file Add dungeon filter command
//  * @description Configures dungeon filter for boss kill loot notifications
//  */

// const {
//   SlashCommandBuilder,
//   InteractionContextType,
//   PermissionFlagsBits,
//   MessageFlags,
// } = require("discord.js");

// const { addLootFilter } = require("../../db/database.js");
// const logger = require("../../logger.js");

// module.exports = {
//   data: new SlashCommandBuilder()
//     .setName("addlootfilter")
//     .setDescription("Добавить фильтр подземелий для вывода лута")
//     .setContexts(InteractionContextType.Guild)
//     .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
//     .addIntegerOption((option) =>
//       option
//         .setName("map_id")
//         .setDescription("ID подземелья")
//         .setMinValue(0)
//         .setRequired(true),
//     )
//     .addStringOption((option) =>
//       option
//         .setName("encounter_id")
//         .setDescription(
//           "ID энкаунтеров через запятую (оставьте пустым для всех энкаунтеров)",
//         )
//         .setRequired(false),
//     ),

//   /**
//    * Executes the addLootfilter command
//    * @param {import('discord.js').CommandInteraction} interaction - Command interaction
//    */
//   async execute(interaction) {
//     const guild = interaction.guild;
//     const guild_name = guild?.name ?? "USER";
//     const guild_id = guild?.id ?? interaction.user.id;
//     const user_tag = interaction.user.tag;
//     const command_name = interaction.commandName;

//     const map_id = interaction.options.getInteger("map_id");
//     const encounter_ids_string = interaction.options.getString("encounter_id");

//     logger.info(
//       `[${guild_name} (${guild_id})] [${user_tag}] ` +
//         `Using command: /${command_name} [${map_id}, ${encounter_ids_string}]`,
//     );

//     if (!guild) {
//       return interaction.reply({
//         content:
//           "Используйте эту команду в текстовом канале Вашего дискорд сервера!",
//         flags: MessageFlags.Ephemeral,
//       });
//     }

//     if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) {
//       return interaction.reply({
//         content: "У вас нет прав на использование этой команды.",
//         flags: MessageFlags.Ephemeral,
//       });
//     }

//     const encounters_id =
//       encounter_ids_string
//         ?.split(",")
//         .map((id) => parseInt(id.trim()))
//         .filter((id) => !isNaN(id) && id > 0) ?? [];

//     if (encounter_ids_string && encounters_id.length === 0) {
//       return interaction.reply({
//         content: "Ошибка: не удалось распознать ID энкаунтеров!",
//         flags: MessageFlags.Ephemeral,
//       });
//     }

//     try {
//       const settings = await addLootFilter(guild.id, {
//         [String(map_id)]: encounters_id || [],
//       });
//       logger.debug(`Updated filters: ${JSON.stringify(settings.filter)}`);

//       const filterValues = settings.filter.get(String(map_id)) || [];

//       return interaction.reply(
//         `Фильтр для подземелья ${map_id} успешно добавлен!\n` +
//           `Текущие энкаунтеры для этого подземелья: ${filterValues.length > 0 ? filterValues.join(", ") : "Все энкаунтеры"}`,
//       );
//     } catch (error) {
//       logger.error(`Error setting loot filter: ${error.message}`);

//       if (error.name === "LootSettingsNotFoundError") {
//         return interaction.reply({
//           content:
//             "Настройки лута не найдены для этого сервера. Пожалуйста, настройте вывод лута с помощью команды /setloot.",
//           flags: MessageFlags.Ephemeral,
//         });
//       }

//       return interaction.reply({
//         content: "Произошла внутренняя ошибка при установке фильтра.",
//         flags: MessageFlags.Ephemeral,
//       });
//     }
//   },
// };
