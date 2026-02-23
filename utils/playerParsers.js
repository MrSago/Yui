const { formatShortValue } = require("./formatters.js");
const classEmoji = require("../config/classEmoji.js");
const logger = require("../logger.js").child({ module: "utils/playerParsers" });

/**
 * Gets emoji for a player
 * @param {Object} player - Player data
 * @param {Object} client - Discord client
 * @returns {string|null} Emoji or null
 */
function getPlayerEmoji(player, client) {
  try {
    const spec = classEmoji[player.class_id].spec[player.spec];

    return client.emojis.cache.get(spec.emoji_id);
  } catch (error) {
    logger.error(error);
    logger.warn({ player_name: player.name }, "Can't get emoji for player");
    return null;
  }
}

/**
 * Parses DPS player data
 * @param {Array} data - Array of player data
 * @param {Object} client - Discord client
 * @returns {Array} [rows, summary_dps]
 */
function parseDpsPlayers(data, client) {
  data.sort((a, b) => b.dps - a.dps);

  let i = 1;
  const rows = [];
  let summary_dps = 0;

  for (const player of data) {
    const spec = classEmoji[player.class_id]?.spec[player.spec];

    // Skip healers
    if (spec?.heal) continue;

    const emoji = getPlayerEmoji(player, client);

    const dps_int = parseInt(player.dps);
    if (dps_int) {
      rows.push({
        place: i++,
        name: (emoji ? `${emoji}` : "") + player.name,
        value: formatShortValue(dps_int),
        intValue: dps_int,
      });
      summary_dps += dps_int;
    } else {
      rows.push({
        place: i++,
        name: (emoji ? `${emoji}` : "") + player.name,
        value: "0k",
        intValue: 0,
      });
    }
  }

  if (rows.length === 0) {
    return [[], 0];
  }

  for (let i = 0; i < rows.length; i++) {
    const percent = (rows[i].intValue / summary_dps) * 100;
    rows[i].percent = Math.round(percent * 100) / 100;
  }

  return [rows, summary_dps];
}

/**
 * Parses HPS player data (healers)
 * @param {Array} data - Array of player data
 * @param {Object} client - Discord client
 * @returns {Array} [rows, summary_hps]
 */
function parseHealPlayers(data, client) {
  data.sort((a, b) => b.hps - a.hps);

  let i = 1;
  const rows = [];
  let summary_hps = 0;

  for (const player of data) {
    const spec = classEmoji[player.class_id]?.spec[player.spec];

    // Only healers
    if (!spec?.heal) continue;

    const emoji = getPlayerEmoji(player, client);

    const hpsInt = parseInt(player.hps);
    if (hpsInt) {
      rows.push({
        place: i++,
        name: (emoji ? `${emoji}` : "") + player.name,
        value: formatShortValue(hpsInt),
        intValue: hpsInt,
      });
      summary_hps += hpsInt;
    } else {
      rows.push({
        place: i++,
        name: (emoji ? `${emoji}` : "") + player.name,
        value: "0k",
        intValue: 0,
      });
    }
  }

  if (rows.length === 0) {
    return [[], 0];
  }

  for (let i = 0; i < rows.length; i++) {
    const percent = (rows[i].intValue / summary_hps) * 100;
    rows[i].percent = Math.round(percent * 100) / 100;
  }

  return [rows, summary_hps];
}

module.exports = {
  getPlayerEmoji,
  parseDpsPlayers,
  parseHealPlayers,
};
