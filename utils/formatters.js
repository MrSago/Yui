/**
 * Converts an integer to short format with 'k' suffix
 * @param {number} value - Number to format
 * @returns {number} Formatted number (e.g., 12345 -> 12.3)
 * @example
 * intToShortFormat(12345) // 12.3
 * intToShortFormat(1500)  // 1.5
 */
function intToShortFormat(value) {
  return +(value.toFixed(1) / 1000).toFixed(1);
}

/**
 * Formats a number with thousand separators
 * @param {number} value - Number to format
 * @returns {string} Formatted string
 * @example
 * formatNumber(1234567) // "1,234,567"
 */
function formatNumber(value) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Formats DPS/HPS value for display
 * @param {number} value - DPS/HPS value
 * @returns {string} Formatted string with 'k' suffix
 * @example
 * formatDpsValue(12345) // "12.3k"
 */
function formatDpsValue(value) {
  const parsed = parseInt(value);
  return parsed ? `${intToShortFormat(parsed)}k` : "0k";
}

module.exports = {
  intToShortFormat,
  formatNumber,
  formatDpsValue,
};
