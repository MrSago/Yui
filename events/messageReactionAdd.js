
const { bot } = require('../index.js');
const { getChannelId } = require('../auctionator.js');
const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageReactionAdd,
    once: false,

    async execute(messageReaction, user) {
        try {
            if (msgReaction.message.partial) {
                await msgReaction.message.fetch();
            }
            if (msgReaction.partial) {
                await msgReaction.fetch();
            }
        } catch (error) {
            console.error(`Something went wrong when fetching the message:${error}`);
        }

        const auc_channel_id = getChannelId(messageReaction.message.guild.id);
        if (auc_channel_id === undefined) {
            return;
        }

        if (messageReaction.message.channel.id === auc_channel_id) { 
            if (messageReaction.message.user.id === bot.user.id) {
                messageReaction.message.reactions.removeAll();
            }
        }
    },
};

