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
const bossThumbnails = require("../../config/bossThumbnails.js");
const { formatShortValue } = require("../../utils/formatters.js");
const sirusApi = require("../../api/sirusApi.js");

const INVISIBLE_SPACE = "\u2800";

/**
 * Creates a complete boss kill message with all sections
 * @param {Object} params - Message parameters
 * @param {Object} params.bossKillInfo - Boss kill information
 * @param {string} params.realmId - Realm ID
 * @param {string} params.recordId - Record ID
 * @param {string} params.guildId - Discord guild ID
 * @param {import('discord.js').Client} params.client - Discord client
 * @param {Array<Object>} params.lootItems - Array of loot item objects
 * @param {Object} params.dpsData - DPS data [rows, summaryDps]
 * @param {Object} params.hpsData - HPS data [rows, summaryHps]
 * @returns {import('discord.js').EmbedBuilder}
 */
function createCompleteBossKillEmbed({
  bossKillInfo,
  realmId,
  recordId,
  guildId,
  client,
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

  setBossThumbnail(embed, bossKillInfo.boss_name);

  const [dpsRows, summaryDps] = dpsData;
  addDpsSection(embed, dpsRows, summaryDps);

  const [hpsRows, summaryHps] = hpsData;
  addHpsSection(embed, hpsRows, summaryHps);

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
    },
  );
}

/**
 * Adds DPS section to embed
 * @param {import('discord.js').EmbedBuilder} embed - Embed message
 * @param {Array<Object>} rows - Player rows
 * @param {number} summaryDps - Total DPS
 * @returns {import('discord.js').EmbedBuilder}
 */
function addDpsSection(embed, rows, summaryDps) {
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
    },
  );
  embed.addFields(
    {
      name: "Дамагеры",
      value: formatPlayersTable(rows, "Урон"),
    },
  );
  return embed;
}

/**
 * Adds HPS section to embed
 * @param {import('discord.js').EmbedBuilder} embed - Embed message
 * @param {Array<Object>} rows - Player rows
 * @param {number} summaryHps - Total HPS
 * @returns {import('discord.js').EmbedBuilder}
 */
function addHpsSection(embed, rows, summaryHps) {
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
    },
  );
  embed.addFields(
    {
      name: "Хиллеры",
      value: formatPlayersTable(rows, "Лечение"),
    },
  );
  return embed;
}

/**
 * Builds aligned table for player rows
 * @param {Array<Object>} rows - Player rows
 * @param {string} valueLabel - Value column label
 * @returns {string}
 */
function formatPlayersTable(rows, valueLabel) {
  if (!rows || rows.length === 0) {
    return "\u200b";
  }

  const getVisibleLength = (text) =>
    text.replace(/<a?:\w+:\d+>/g, "x").length;

  const placeWidth = Math.max(
    ...rows.map((row) => getVisibleLength(String(row.place))),
  );
  const nameWidth = Math.max(
    ...rows.map((row) => getVisibleLength(row.name)),
  );

  const padColumn = (text, width) => {
    const padding = Math.max(0, width - getVisibleLength(text) + 1);
    return `${text}${INVISIBLE_SPACE.repeat(padding)}`;
  };

  const lines = rows.map((row) => {
    const place = padColumn(String(row.place), placeWidth);
    const name = padColumn(row.name, nameWidth);
    return `${place}${name}${row.value}`;
  });

  const trimmedLines = [];
  for (const line of lines) {
    const next = trimmedLines.length === 0 ? line : `${trimmedLines.join("\n")}\n${line}`;
    if (next.length > 1024) {
      const overflowLine = "…";
      const overflowCandidate = `${trimmedLines.join("\n")}\n${overflowLine}`;
      if (overflowCandidate.length <= 1024) {
        return overflowCandidate;
      }
      return trimmedLines.join("\n");
    }
    trimmedLines.push(line);
  }

  return trimmedLines.join("\n");
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
 * @returns {import('discord.js').EmbedBuilder}
 */
function setBossThumbnail(embed, bossName) {
  if (bossThumbnails[bossName]) {
    embed.setThumbnail(bossThumbnails[bossName]);
  }
  return embed;
}

module.exports = {
  createCompleteBossKillEmbed,
};
