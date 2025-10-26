const mongoose = require("mongoose");

/**
 * Changelog Schema
 * Represents changelog channel configuration
 */
const changelogSchema = new mongoose.Schema(
  {
    channel_id: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "changelog",
  }
);

const Changelog = mongoose.model("Changelog", changelogSchema);

module.exports = Changelog;
