/**
 * @file Loot embed builder
 * @description Creates embeds for boss kill and loot information
 */

const {
  createEmbed,
  addEmptyField,
  addSupportLink,
} = require("./baseEmbedBuilder.js");
const sirusApi = require("../../api/sirusApi.js");
const config = require("../../config").loot;
const { intToShortFormat } = require("../../utils/formatters.js");

/**
 * Creates a complete boss kill message with all sections
 * @param {Object} params - Message parameters
 * @param {Object} params.bossKillInfo - Boss kill information
 * @param {string} params.realmId - Realm ID
 * @param {string} params.recordId - Record ID
 * @param {string} params.guildId - Discord guild ID
 * @param {import('discord.js').Client} params.client - Discord client
 * @param {Object} params.bossThumbnails - Boss thumbnails mapping
 * @param {Object} params.classEmoji - Class emoji mapping
 * @param {Array<string>} params.lootItems - Array of loot item names
 * @param {Object} params.dpsData - DPS data [places, players, dps, summaryDps]
 * @param {Object} params.hpsData - HPS data [places, players, hps, summaryHps]
 * @returns {import('discord.js').EmbedBuilder}
 */
function createCompleteBossKillEmbed({
  bossKillInfo,
  realmId,
  recordId,
  guildId,
  client,
  bossThumbnails,
  dpsData,
  hpsData,
  lootItems,
}) {
  const embed = createBossKillEmbed({
    bossKillInfo,
    realmId,
    recordId,
    guildId,
    client,
  });

  setBossThumbnail(embed, bossKillInfo.boss_name, bossThumbnails);

  const [placesDps, playersDps, dps, summaryDps] = dpsData;
  addDpsSection(embed, placesDps, playersDps, dps, summaryDps);

  const [placesHps, playersHps, hps, summaryHps] = hpsData;
  addHpsSection(embed, placesHps, playersHps, hps, summaryHps);

  const lootStr = lootItems.join("\n");
  addSimpleLootSection(embed, lootStr);

  addSupportLink(embed);

  return embed;
}

/**
 * Creates a boss kill embed
 * @param {Object} params - Embed parameters
 * @param {Object} params.bossKillInfo - Boss kill information
 * @param {string} params.realmId - Realm ID
 * @param {string} params.recordId - Record ID
 * @param {string} params.guildId - Discord guild ID
 * @param {import('discord.js').Client} params.client - Discord client
 * @returns {import('discord.js').EmbedBuilder}
 */
function createBossKillEmbed({
  bossKillInfo,
  realmId,
  recordId,
  guildId,
  client,
}) {
  const realmName = sirusApi.getRealmNameById(realmId);
  const guildIcon = client.guilds.cache.get(guildId)?.iconURL();

  return createEmbed({
    color: config.embed.color,
    author: {
      name: `${bossKillInfo.guild.name}${realmName ? ` - ${realmName}` : ""}`,
      iconURL: guildIcon,
      url: sirusApi.getGuildUrl(realmId, bossKillInfo.guild.id),
    },
    title: `Убийство босса ${bossKillInfo.boss_name}`,
    url: sirusApi.getPveProgressUrl(realmId, recordId),
    footer: {
      text: config.embed.footerText,
      iconURL: config.embed.footerIconUrl,
    },
  }).addFields(
    {
      name: "Попытки",
      value: `${bossKillInfo.attempts}`,
      inline: true,
    },
    {
      name: "Когда убили",
      value: bossKillInfo.killed_at,
      inline: true,
    },
    {
      name: "Время боя",
      value: bossKillInfo.fight_length,
      inline: true,
    }
  );
}

/**
 * Adds DPS section to embed
 * @param {import('discord.js').EmbedBuilder} embed - Embed message
 * @param {string} places - String with places
 * @param {string} players - String with player names
 * @param {string} dps - String with DPS values
 * @param {number} summaryDps - Total DPS
 * @returns {import('discord.js').EmbedBuilder}
 */
function addDpsSection(embed, places, players, dps, summaryDps) {
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
      name: "DPS",
      value: players,
      inline: true,
    },
    {
      name: "Урон",
      value: dps,
      inline: true,
    }
  );
  return embed;
}

/**
 * Adds HPS section to embed
 * @param {import('discord.js').EmbedBuilder} embed - Embed message
 * @param {string} places - String with places
 * @param {string} players - String with player names
 * @param {string} hps - String with HPS values
 * @param {number} summaryHps - Total HPS
 * @returns {import('discord.js').EmbedBuilder}
 */
function addHpsSection(embed, places, players, hps, summaryHps) {
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
      name: "Лечение",
      value: hps,
      inline: true,
    }
  );
  return embed;
}

/**
 * Adds loot section to embed
 * @param {import('discord.js').EmbedBuilder} embed - Embed message
 * @param {string} lootNames - String with loot names
 * @param {string} lootLinks - String with quality links
 * @param {string} lootPlayers - String with player names
 * @returns {import('discord.js').EmbedBuilder}
 */
function addLootSection(embed, lootNames, lootLinks, lootPlayers) {
  addEmptyField(embed);
  embed.addFields(
    {
      name: "Предмет",
      value: lootNames,
      inline: true,
    },
    {
      name: "Качество",
      value: lootLinks,
      inline: true,
    },
    {
      name: "Игрок",
      value: lootPlayers,
      inline: true,
    }
  );
  return embed;
}

/**
 * Adds simple loot section to embed (just item names)
 * @param {import('discord.js').EmbedBuilder} embed - Embed message
 * @param {string} lootString - String with item names
 * @returns {import('discord.js').EmbedBuilder}
 */
function addSimpleLootSection(embed, lootString) {
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

/**
 * Sets boss thumbnail if available
 * @param {import('discord.js').EmbedBuilder} embed - Embed message
 * @param {string} bossName - Boss name
 * @param {Object} bossThumbnails - Boss thumbnails mapping
 * @returns {import('discord.js').EmbedBuilder}
 */
function setBossThumbnail(embed, bossName, bossThumbnails) {
  if (bossThumbnails[bossName]) {
    embed.setThumbnail(bossThumbnails[bossName]);
  }
  return embed;
}

module.exports = {
  createCompleteBossKillEmbed,
};
