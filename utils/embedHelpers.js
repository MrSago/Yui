const { EmbedBuilder } = require("discord.js");
const { intToShortFormat } = require("./formatters.js");

/**
 * Adds an empty field to embed (separator)
 * @param {EmbedBuilder} embed - Embed message
 * @returns {EmbedBuilder} Modified embed
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
 * @returns {EmbedBuilder} Modified embed
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
 * Adds DPS section to embed message
 * @param {EmbedBuilder} embed - Embed message
 * @param {string} places - String with places
 * @param {string} players - String with player names
 * @param {string} dps - String with DPS values
 * @param {number} summaryDps - Total DPS
 * @returns {EmbedBuilder} Modified embed
 */
function addDpsSection(embed, places, players, dps, summaryDps) {
  if (!places || !players || !dps || !summaryDps) {
    return embed;
  }

  addEmptyField(embed);

  embed.addFields(
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
      name: "Общий DPS",
      value: `${intToShortFormat(summaryDps)}k`,
      inline: true,
    }
  );

  embed.addFields(
    {
      name: "Место",
      value: places,
      inline: true,
    },
    {
      name: "Имя",
      value: players,
      inline: true,
    },
    {
      name: "DPS",
      value: dps,
      inline: true,
    }
  );

  return embed;
}

/**
 * Adds HPS section to embed message
 * @param {EmbedBuilder} embed - Embed message
 * @param {string} places - String with places
 * @param {string} players - String with player names
 * @param {string} hps - String with HPS values
 * @param {number} summaryHps - Total HPS
 * @returns {EmbedBuilder} Modified embed
 */
function addHpsSection(embed, places, players, hps, summaryHps) {
  if (!places || !players || !hps || !summaryHps) {
    return embed;
  }

  addEmptyField(embed);

  embed.addFields(
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
      name: "Общий HPS",
      value: `${intToShortFormat(summaryHps)}k`,
      inline: true,
    }
  );

  embed.addFields(
    {
      name: "Место",
      value: places,
      inline: true,
    },
    {
      name: "Имя",
      value: players,
      inline: true,
    },
    {
      name: "HPS",
      value: hps,
      inline: true,
    }
  );

  return embed;
}

/**
 * Adds loot section to embed message
 * @param {EmbedBuilder} embed - Embed message
 * @param {string} lootString - String with item names
 * @returns {EmbedBuilder} Modified embed
 */
function addLootSection(embed, lootString) {
  if (!lootString || lootString === "") {
    return embed;
  }

  addEmptyField(embed);

  embed.addFields({
    name: "Лут",
    value: lootString,
  });

  return embed;
}

module.exports = {
  addEmptyField,
  addEmptyInlineFields,
  addDpsSection,
  addHpsSection,
  addLootSection,
};
