/**
 * @file Base embed builder utilities
 * @description Common embed building functionality
 */

const { EmbedBuilder } = require("discord.js");

/**
 * Creates a new embed with default configuration
 * @param {Object} config - Embed configuration
 * @param {string} config.color - Embed color
 * @param {Object} [config.author] - Author configuration
 * @param {string} [config.title] - Embed title
 * @param {string} [config.url] - Embed URL
 * @param {Object} [config.footer] - Footer configuration
 * @param {string} [config.thumbnail] - Thumbnail URL
 * @param {string} [config.image] - Image URL
 * @returns {EmbedBuilder}
 */
function createEmbed(config) {
  const embed = new EmbedBuilder().setColor(config.color);

  if (config.author) {
    embed.setAuthor({
      name: config.author.name,
      iconURL: config.author.iconURL,
      url: config.author.url,
    });
  }

  if (config.title) {
    embed.setTitle(config.title);
  }

  if (config.url) {
    embed.setURL(config.url);
  }

  if (config.footer) {
    embed.setFooter({
      text: config.footer.text,
      iconURL: config.footer.iconURL,
    });
  }

  if (config.thumbnail) {
    embed.setThumbnail(config.thumbnail);
  }

  if (config.image) {
    embed.setImage(config.image);
  }

  return embed;
}

/**
 * Adds an empty field to embed (separator)
 * @param {EmbedBuilder} embed - Embed message
 * @returns {EmbedBuilder}
 */
function addEmptyField(embed) {
  return embed.addFields({
    name: "\u200b",
    value: "\u200b",
  });
}

/**
 * Adds three empty inline fields in one row (for alignment)
 * @param {EmbedBuilder} embed - Embed message
 * @returns {EmbedBuilder}
 */
function addEmptyInlineFields(embed) {
  return embed.addFields(
    {
      name: "\u200b",
      value: "\u200b",
      inline: true,
    },
    {
      name: "\u200b",
      value: "\u200b",
      inline: true,
    },
    {
      name: "\u200b",
      value: "\u200b",
      inline: true,
    }
  );
}

/**
 * Splits long description into multiple embeds if needed
 * @param {string} content - Content to split
 * @param {number} maxLength - Maximum length per embed (default: 4096)
 * @returns {string[]} Array of content chunks
 */
function splitContent(content, maxLength = 4096) {
  if (content.length <= maxLength) {
    return [content];
  }

  const chunks = [];
  let currentChunk = "";

  const lines = content.split("\n");
  for (const line of lines) {
    if (currentChunk.length + line.length + 1 > maxLength) {
      chunks.push(currentChunk);
      currentChunk = line;
    } else {
      currentChunk += (currentChunk ? "\n" : "") + line;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

module.exports = {
  createEmbed,
  addEmptyField,
  addEmptyInlineFields,
  splitContent,
};
