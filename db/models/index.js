/**
 * Models Index
 * Exports all Mongoose models
 */

const Settings = require("./Settings.model.js");
const Changelog = require("./Changelog.model.js");
const Loot = require("./Loot.model.js");
const Records = require("./Records.model.js");
const ChangelogData = require("./ChangelogData.model.js");

module.exports = {
  Settings,
  Changelog,
  Loot,
  Records,
  ChangelogData,
};
