
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { realmIdToString, addItem } = require('../auctionator.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('additem')
        .setDescription('Add item to list')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addIntegerOption(option =>
            option.setName('realm_id')
                .setDescription('Realm')
                .setRequired(true)
                .setChoices(
                    { name: 'Scourge x2', value: 9 },
                    { name: 'Algalon x4', value: 33 },
                    { name: 'Sirus x5', value: 57 }))
        .addIntegerOption(option =>
            option.setName('item_id')
                .setDescription('Item ID')
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

        const message = `${addedItem.name} with id ${item_id} from ${realmIdToString(realm_id)} ` +
                        `successfully added to list\nCurrent average price: ${addedItem.price}`;
        await interaction.reply(message);
    }
};

