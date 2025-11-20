/**
 * Converts an integer to short format with 'k' suffix
 * @param {number} value - Number to format
 * @returns {number} Formatted number (e.g., 12345 -> 12.3)
 * @example
 * intToShortFormat(12345) // 12.3
 * intToShortFormat(1500)  // 1.5
 */
function intToShortFormat(value) {
  return +(value / 1000).toFixed(1);
}

/**
 * Converts an integer to millions format
 * @param {number} value - Number to format
 * @returns {number} Formatted number (e.g., 1234567 -> 1.2)
 * @example
 * intToMillionsFormat(1234567) // 1.2
 * intToMillionsFormat(5500000) // 5.5
 */
function intToMillionsFormat(value) {
  return +(value / 1000000).toFixed(1);
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
 * Formats value to short for display
 * @param {number} value - Number to format
 * @returns {string} Formatted string with 'k' or 'm' suffix
 * @example
 * formatShortValue(12345) // "12.3k"
 * formatShortValue(1234567) // "1.2m"
 */
function formatShortValue(value) {
  const parsed = parseInt(value);
  if (!parsed) return "0k";

  if (parsed >= 1000000) {
    return `${intToMillionsFormat(parsed)}m`;
  }

  return `${intToShortFormat(parsed)}k`;
}

module.exports = {
  formatNumber,
  formatShortValue,
};
