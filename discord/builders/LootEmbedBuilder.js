const BaseEmbedBuilder = require("./BaseEmbedBuilder.js");
const sirusApi = require("../../api/sirusApi.js");
const config = require("../../config").loot;
const { intToShortFormat } = require("../../utils/formatters.js");

/**
 * Loot Embed Builder
 * Creates embeds for boss kill and loot information
 */
class LootEmbedBuilder extends BaseEmbedBuilder {
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
  static createBossKillEmbed({
    bossKillInfo,
    realmId,
    recordId,
    guildId,
    client,
  }) {
    const realmName = sirusApi.getRealmNameById(realmId);
    const guildIcon = client.guilds.cache.get(guildId)?.iconURL();

    return this.createEmbed({
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
  static addDpsSection(embed, places, players, dps, summaryDps) {
    this.addEmptyField(embed);
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
      },
      {
        name: "\u200b",
        value: `Всего: **${intToShortFormat(summaryDps)}**`,
        inline: false,
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
  static addHpsSection(embed, places, players, hps, summaryHps) {
    this.addEmptyField(embed);
    embed.addFields(
      {
        name: "Место",
        value: places,
        inline: true,
      },
      {
        name: "HPS",
        value: players,
        inline: true,
      },
      {
        name: "Лечение",
        value: hps,
        inline: true,
      },
      {
        name: "\u200b",
        value: `Всего: **${intToShortFormat(summaryHps)}**`,
        inline: false,
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
  static addLootSection(embed, lootNames, lootLinks, lootPlayers) {
    this.addEmptyField(embed);
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
  static addSimpleLootSection(embed, lootString) {
    if (!lootString || lootString === "") {
      return embed;
    }

    this.addEmptyField(embed);
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
  static setBossThumbnail(embed, bossName, bossThumbnails) {
    if (bossThumbnails[bossName]) {
      embed.setThumbnail(bossThumbnails[bossName]);
    }
    return embed;
  }
}

module.exports = LootEmbedBuilder;
