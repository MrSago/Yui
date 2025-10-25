/**
 * @file Utility tools module
 * @description Provides various utility functions for time calculations, formatting, and Discord operations
 */

const config = require("./environment.js");

const { REST } = require("discord.js");

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
      milliseconds
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

/**
 * Generates random integer from 0 to max (exclusive)
 * @param {number} max - Maximum value (exclusive)
 * @returns {number} Random integer
 */
function randInt(max) {
  return Math.floor(Math.random() * max);
}

/**
 * Sets voice status for a Discord channel
 * @param {string} channel_id - Discord channel ID
 * @param {string} status - Status text to set
 * @returns {Promise<void>}
 */
async function setVoiceStatus(channel_id, status) {
  const rest = new REST({ version: "10" }).setToken(config.discord.token);
  payload = { status: status };
  await rest.put(`/channels/${channel_id}/voice-status`, {
    body: payload,
  });
}

module.exports = {
  dayInterval: dayInterval,
  getDurationString: getDurationString,
  randInt: randInt,
  setVoiceStatus: setVoiceStatus,
};
