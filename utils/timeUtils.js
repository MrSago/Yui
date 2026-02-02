/**
 * @file Time utility functions
 * @description Provides utility functions for time calculations and formatting
 */

const STARTUPTIME = new Date();

/**
 * Calculates interval from startup time to specific time of day
 * @param {number} hours - Hour of day (0-23)
 * @param {number} minutes - Minutes (0-59)
 * @param {number} seconds - Seconds (0-59)
 * @param {number} milliseconds - Milliseconds (0-999)
 * @returns {number} Milliseconds until specified time
 */
function dayInterval(hours, minutes, seconds, milliseconds) {
  var ms =
    new Date(
      STARTUPTIME.getFullYear(),
      STARTUPTIME.getMonth(),
      STARTUPTIME.getDate(),
      hours,
      minutes,
      seconds,
      milliseconds,
    ) - STARTUPTIME;
  return ms < 0 ? ms + 86400000 : ms;
}

/**
 * Converts duration in milliseconds to formatted string HH:MM:SS
 * @param {number} duration_ms - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
function getDurationString(duration_ms) {
  const duration_seconds = Math.floor(duration_ms / 1000);
  const duration_minutes = Math.floor(duration_seconds / 60);

  const hours = Math.floor(duration_minutes / 60);
  const minutes = duration_minutes % 60;
  const seconds = duration_seconds % 60;

  const result =
    `${hours < 10 ? `0${hours}` : hours}` +
    ":" +
    `${minutes < 10 ? `0${minutes}` : minutes}` +
    ":" +
    `${seconds < 10 ? `0${seconds}` : seconds}`;

  return result;
}

module.exports = {
  dayInterval,
  getDurationString,
};
