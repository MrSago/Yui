/**
 * @file Loot embed builder
 * @description Creates embeds for boss kill and loot information
 */

const {
  createEmbed,
  addEmptyField,
  addSupportLink,
} = require("./baseEmbedBuilder.js");
const { loot: config } = require("../../config/index.js");
const { formatShortValue } = require("../../utils/formatters.js");
const sirusApi = require("../../api/sirusApi.js");

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
 * @param {Array<Object>} params.lootItems - Array of loot item objects
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

  if (lootItems && lootItems.length > 0) {
    addLootSectionToEmbed(embed, lootItems, realmId);
  }

  embed.setFooter({
    text: config.embed.footerText,
    iconURL: config.embed.footerIconUrl,
  });
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
      value: formatShortValue(summaryDps),
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
      value: formatShortValue(summaryHps),
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
 * Adds loot section to embed with item links
 * @param {import('discord.js').EmbedBuilder} embed - Embed message
 * @param {Array<Object>} lootItems - Array of loot item objects
 * @param {number} realmId - Realm ID
 * @returns {import('discord.js').EmbedBuilder}
 */
function addLootSectionToEmbed(embed, lootItems, realmId) {
  const lootString = lootItems
    .map((item) => {
      const itemUrl = sirusApi.getItemUrl(item.entry, realmId);
      return `[${item.name}](${itemUrl})`;
    })
    .join("\n");

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
