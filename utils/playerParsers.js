const logger = require("../logger.js");
const { formatDpsValue } = require("./formatters.js");

/**
 * Gets emoji for a player
 * @param {Object} player - Player data
 * @param {Object} classEmoji - Class to emoji mapping
 * @param {Object} client - Discord client
 * @param {Object} easterEggConfig - Easter egg configuration
 * @returns {string|null} Emoji or null
 */
function getPlayerEmoji(player, classEmoji, client, easterEggConfig) {
  try {
    const spec = classEmoji[player.class_id].spec[player.spec];

    // Easter egg check
    if (easterEggConfig && easterEggConfig.players.includes(player.name)) {
      return client.emojis.cache.get(easterEggConfig.emojiId);
    }

    return client.emojis.cache.get(spec.emoji_id);
  } catch (error) {
    logger.error(error);
    logger.warn(`Can't get emoji for ${player.name}`);
    return null;
  }
}

/**
 * Parses DPS player data
 * @param {Array} data - Array of player data
 * @param {Object} classEmoji - Class to emoji mapping
 * @param {Object} client - Discord client
 * @param {Object} easterEggConfig - Easter egg configuration
 * @returns {Array} [places, players, dps, summary_dps]
 */
function parseDpsPlayers(data, classEmoji, client, easterEggConfig) {
  data.sort((a, b) => b.dps - a.dps);

  let i = 1;
  let places = "";
  let players = "";
  let dps = "";
  let summary_dps = 0;

  for (const player of data) {
    const spec = classEmoji[player.class_id]?.spec[player.spec];

    // Skip healers
    if (spec?.heal) continue;

    const emoji = getPlayerEmoji(player, classEmoji, client, easterEggConfig);

    places += `**${i++}**\n`;
    players += (emoji ? `${emoji}` : "") + `${player.name}\n`;

    const dps_int = parseInt(player.dps);
    if (dps_int) {
      dps += `${formatDpsValue(dps_int)}\n`;
      summary_dps += dps_int;
    } else {
      dps += "0k\n";
    }
  }

  if (places === "" || players === "" || dps === "") {
    return ["\u200b", "\u200b", "\u200b", 0];
  }

  return [places, players, dps, summary_dps];
}

/**
 * Parses HPS player data (healers)
 * @param {Array} data - Array of player data
 * @param {Object} classEmoji - Class to emoji mapping
 * @param {Object} client - Discord client
 * @returns {Array} [places, players, hps, summary_hps]
 */
function parseHealPlayers(data, classEmoji, client) {
  data.sort((a, b) => b.hps - a.hps);

  let i = 1;
  let places = "";
  let players = "";
  let hps = "";
  let summary_hps = 0;

  for (const player of data) {
    const spec = classEmoji[player.class_id]?.spec[player.spec];

    // Only healers
    if (!spec?.heal) continue;

    const emoji = getPlayerEmoji(player, classEmoji, client);

    places += `**${i++}**\n`;
    players += (emoji ? `${emoji}` : "") + `${player.name}\n`;

    const hpsInt = parseInt(player.hps);
    if (hpsInt) {
      hps += `${formatDpsValue(hpsInt)}\n`;
      summary_hps += hpsInt;
    } else {
      hps += "0k\n";
    }
  }

  if (places === "" || players === "" || hps === "") {
    return ["\u200b", "\u200b", "\u200b", 0];
  }

  return [places, players, hps, summary_hps];
}

module.exports = {
  parseDpsPlayers,
  parseHealPlayers,
  getPlayerEmoji,
};
