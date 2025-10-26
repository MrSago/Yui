/**
 * @file Random utility functions
 * @description Provides utility functions for random number generation
 */

/**
 * Generates random integer from 0 to max (exclusive)
 * @param {number} max - Maximum value (exclusive)
 * @returns {number} Random integer
 */
function randInt(max) {
  return Math.floor(Math.random() * max);
}

module.exports = {
  randInt,
};
