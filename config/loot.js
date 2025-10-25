/**
 * @file Loot configuration
 * @description Configuration settings for loot tracking, embeds, and bot activity
 */

module.exports = {
  dataPath: "./loot",

  updateIntervalMs: 1000 * 60 * 30,

  files: {
    bossThumbnails: "bossThumbnails.json",
    classEmoji: "classEmoji.json",
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
      name: "Чилю",
      type: "Custom",
      status: "online",
    },
  },

  easterEgg: {
    players: ["Furatoru"],
    emojiId: "1067786576639295488",
  },
};
