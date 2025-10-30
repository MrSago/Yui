/**
 * @file Configuration index
 * @description Central export point for all configuration modules
 */

const changelog = require("./changelog.js");
const loot = require("./loot.js");
const sirus = require("./sirus.js");

module.exports = {
  changelog,
  loot,
  sirus,
};
