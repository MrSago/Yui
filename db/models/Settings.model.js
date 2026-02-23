const mongoose = require("mongoose");

/**
 * Settings Schema
 * Represents guild-specific settings
 */
const settingsSchema = new mongoose.Schema(
  {
    guild_id: {
      type: String,
      required: true,
      unique: true,
    },
    changelog_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Changelog",
      index: true,
    },
    loot_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loot",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "settings",
  },
);

const Settings = mongoose.model("Settings", settingsSchema);

module.exports = Settings;
