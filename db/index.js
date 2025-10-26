/**
 * Database Module Index
 *
 * This module exports the new database architecture using Repository pattern with Mongoose.
 *
 * @module db
 *
 * Structure:
 * - models/         - Mongoose schemas and models
 * - repositories/   - Data access layer (CRUD operations)
 * - services/       - Business logic layer
 * - database.js     - Main facade (unified API)
 * - mongoose.connection.js - Database connection
 */

module.exports = require("./database.js");

module.exports.repositories = require("./repositories/index.js");
module.exports.services = require("./services/index.js");
module.exports.models = require("./models/index.js");
module.exports.connection = require("./mongoose.connection.js");
