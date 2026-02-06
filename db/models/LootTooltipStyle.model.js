const mongoose = require("mongoose");

/**
 * Loot Tooltip Style Schema
 * Stores shared tooltip stylesheet URLs for each realm
 */
const lootTooltipStyleSchema = new mongoose.Schema(
  {
    realm_id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    styles: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "loot_tooltip_styles",
  },
);

const LootTooltipStyle = mongoose.model("LootTooltipStyle", lootTooltipStyleSchema);

module.exports = LootTooltipStyle;
