const BaseEmbedBuilder = require("./BaseEmbedBuilder.js");
const sirusApi = require("../../api/sirusApi.js");
const config = require("../../config").changelog;

/**
 * Changelog Embed Builder
 * Creates embeds for changelog updates
 */
class ChangelogEmbedBuilder extends BaseEmbedBuilder {
  /**
   * Creates a changelog embed
   * @returns {import('discord.js').EmbedBuilder}
   */
  static createChangelogEmbed() {
    return this.createEmbed({
      color: config.embed.color,
      author: {
        name: config.embed.authorName,
        iconURL: config.embed.authorIconUrl,
        url: config.embed.authorUrl,
      },
      title: config.embed.title,
      url: sirusApi.getChangelogUrl(),
      footer: {
        text: config.embed.footerText,
        iconURL: config.embed.footerIconUrl,
      },
    });
  }

  /**
   * Creates embeds for changelog data with automatic splitting
   * @param {Array<Object>} changelogData - Array of changelog entries
   * @returns {Array<import('discord.js').EmbedBuilder>} Array of embeds
   */
  static createChangelogEmbeds(changelogData) {
    const embeds = [];
    let currentMessage = "";

    for (let i = 0; i < changelogData.length; i++) {
      const entry = changelogData[i].message;
      
      if (currentMessage.length + entry.length + 2 >= 4096) {
        const embed = this.createChangelogEmbed();
        embed.setDescription(currentMessage);
        embeds.push(embed);
        currentMessage = "";
      }
      
      currentMessage += `${entry}\n\n`;
    }

    if (currentMessage.length > 0) {
      const embed = this.createChangelogEmbed();
      embed.setDescription(currentMessage);
      embeds.push(embed);
    }

    return embeds;
  }
}

module.exports = ChangelogEmbedBuilder;
