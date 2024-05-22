const config = require("./environment.js");

const { REST } = require("discord.js");

const STARTUPTIME = new Date();

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

function randInt(max) {
  return Math.floor(Math.random() * max);
}

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
