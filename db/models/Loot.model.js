const mongoose = require("mongoose");

/**
 * Loot Schema
 * Represents loot channel configuration
 */
const lootSchema = new mongoose.Schema(
  {
    channel_id: {
      type: String,
      required: true,
      index: true,
    },
    realm_id: {
      type: Number,
      required: true,
      index: true,
    },
    guild_sirus_id: {
      type: Number,
      required: true,
      index: true,
    },
    dungeon_filter: {
      type: [Number],
      default: [],
      index: true,
    },
    boss_filter: {
      type: [Number],
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "loot",
  }
);

const Loot = mongoose.model("Loot", lootSchema);

module.exports = Loot;
