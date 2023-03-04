const { getChannelId } = require("../auctionator.js");
const { Events } = require("discord.js");

module.exports = {
    name: Events.MessageReactionAdd,
    once: false,

    async execute(reaction, user) {
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch {
                return;
            }
        }

        const auc_channel_id = getChannelId(reaction.message.guild.id);
        if (auc_channel_id === undefined) {
            return;
        }

        if (reaction.message.channel.id === auc_channel_id) {
            reaction.message.reactions.removeAll();
        }
    },
};
