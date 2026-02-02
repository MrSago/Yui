const mongoose = require("mongoose");

/**
 * Records Schema
 * Represents guild records tracking
 */
const recordsSchema = new mongoose.Schema(
  {
    guild_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    records: {
      type: [String],
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "records",
  },
);

const Records = mongoose.model("Records", recordsSchema);

module.exports = Records;
