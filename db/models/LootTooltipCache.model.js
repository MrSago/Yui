const mongoose = require("mongoose");

/**
 * Loot Tooltip Cache Schema
 * Stores rendered tooltip HTML by item ID
 */
const lootTooltipCacheSchema = new mongoose.Schema(
  {
    item_entry: {
      type: Number,
      required: true,
    },
    tooltip_html: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "loot_tooltip_cache",
  },
);

lootTooltipCacheSchema.index({ item_entry: 1 }, { unique: true });

const LootTooltipCache = mongoose.model(
  "LootTooltipCache",
  lootTooltipCacheSchema,
);

module.exports = LootTooltipCache;
