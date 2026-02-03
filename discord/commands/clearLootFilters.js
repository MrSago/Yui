// /**
//  * @file Clear filters command
//  * @description Clears dungeon and boss filters for loot notifications
//  */

// const {
//   SlashCommandBuilder,
//   InteractionContextType,
//   PermissionFlagsBits,
//   MessageFlags,
// } = require("discord.js");

// const { clearLootFilters } = require("../../db/database.js");
// const logger = require("../../logger.js");

// module.exports = {
//   data: new SlashCommandBuilder()
//     .setName("clearlootfilters")
//     .setDescription("Очистить все фильтры для вывода лута")
//     .setContexts(InteractionContextType.Guild)
//     .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

//   /**
//    * Executes the clearlootfilters command
//    * @param {import('discord.js').CommandInteraction} interaction - Command interaction
//    */
//   async execute(interaction) {
//     const guild = interaction.guild;
//     const guild_name = guild?.name ?? "USER";
//     const guild_id = guild?.id ?? interaction.user.id;
//     const user_tag = interaction.user.tag;
//     const command_name = interaction.commandName;

//     logger.info(
//       `[${guild_name} (${guild_id})] [${user_tag}] ` +
//         `Using command: /${command_name}`,
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

//     try {
//       await clearLootFilters(guild.id);

//       return interaction.reply("Все фильтры очищены успешно!");
//     } catch (error) {
//       logger.error(`Error clearing filters: ${error.message}`);

//       if (error.name === "LootSettingsNotFoundError") {
//         return interaction.reply({
//           content: `Настройки лута не найдены для этого сервера.`,
//           flags: MessageFlags.Ephemeral,
//         });
//       }

//       return interaction.reply({
//         content: `Произошла внутренняя ошибка при очистке фильтров лута.`,
//         flags: MessageFlags.Ephemeral,
//       });
//     }
//   },
// };
