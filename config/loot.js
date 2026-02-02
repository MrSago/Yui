/**
 * @file Loot configuration
 * @description Configuration settings for loot tracking, embeds, and bot activity
 */

module.exports = {
  dataPath: "./loot",

  updateIntervalMs: 1000 * 60 * 5,

  files: {
    blacklist: "blacklist.json",
  },

  embed: {
    color: "#0099ff",
    footerText: "Юи, Ваш ассистент",
    footerIconUrl: "https://i.imgur.com/LvlhrPY.png",
  },

  activity: {
    processingStatus: {
      name: "Обрабатываю киллы боссов",
      type: "Custom",
      status: "dnd",
    },
    idleStatus: {
      name: "С возвращением!",
      type: "Custom",
      status: "online",
    },
    devStatus: {
      name: "В режиме разработки",
      type: "Custom",
      status: "idle",
    },
  },
};
