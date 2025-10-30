/**
 * Models Index
 * Exports all Mongoose models
 */

const Changelog = require("./Changelog.model.js");
const ChangelogData = require("./ChangelogData.model.js");
const Loot = require("./Loot.model.js");
const Records = require("./Records.model.js");
const Settings = require("./Settings.model.js");

module.exports = {
  Changelog,
  ChangelogData,
  Loot,
  Records,
  Settings,
};
