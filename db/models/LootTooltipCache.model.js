const mongoose = require("mongoose");

/**
 * Loot Tooltip Cache Schema
 * Stores rendered tooltip HTML by item and realm IDs
 */
const lootTooltipCacheSchema = new mongoose.Schema(
  {
    item_entry: {
      type: Number,
      required: true,
      index: true,
    },
    realm_id: {
      type: Number,
      required: true,
      index: true,
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

lootTooltipCacheSchema.index({ item_entry: 1, realm_id: 1 }, { unique: true });

const LootTooltipCache = mongoose.model(
  "LootTooltipCache",
  lootTooltipCacheSchema,
);

module.exports = LootTooltipCache;
