const mongoose = require("mongoose");

/**
 * ChangelogData Schema
 * Represents changelog data storage
 */
const changelogDataSchema = new mongoose.Schema(
  {
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "changelog_data",
  },
);

const ChangelogData = mongoose.model("ChangelogData", changelogDataSchema);

module.exports = ChangelogData;
