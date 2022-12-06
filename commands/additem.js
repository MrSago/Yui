
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateEmbed, realmIdToString, addItem } = require('../auctionator.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('additem')
        .setDescription('Добавить предмет в список')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addIntegerOption(option =>
            option.setName('realm_id')
                .setDescription('Выберите реалм')
                .setRequired(true)
                .setChoices(
                    { name: 'Scourge x2', value: 9 },
                    { name: 'Algalon x4', value: 33 },
                    { name: 'Sirus x5', value: 57 }))
        .addIntegerOption(option =>
            option.setName('item_id')
                .setDescription('Id предмета')
                .setRequired(true)),

    async execute(interaction) {
        const guild_id = interaction.guild.id;
        const realm_id = interaction.options.getInteger('realm_id');
        const item_id = interaction.options.getInteger('item_id');

        const addedItem = await addItem(guild_id, realm_id, item_id)
            .catch(error => {
                console.error(error);
                interaction.reply({ content: error.message, ephemeral: true });
            });
        if (addedItem === undefined) {
            return;
        }

        updateEmbed();

        const message = `${addedItem.name} (id: ${item_id}) из реалма ${realmIdToString(realm_id)} ` +
                        `успешно добавлен в список\nТекущая средняя цена: ${addedItem.price}`;
        await interaction.reply(message);
    }
};

