/**
 * @file Environment configuration module
 * @description Loads and exports environment variables for Discord and Database configuration
 */

require("dotenv").config();

/**
 * Application configuration object
 * @type {Object}
 * @property {Object} discord - Discord bot configuration
 * @property {string} discord.token - Discord bot token
 * @property {string} discord.client_id - Discord application client ID
 * @property {string} discord.log_guild_id - Guild ID for logging
 * @property {string} discord.log_channel_id - Channel ID for logging
 * @property {Object} db - Database configuration
 * @property {string} db.cluster_url - MongoDB cluster URL
 * @property {string} db.port - MongoDB port
 * @property {string} db.user - MongoDB username
 * @property {string} db.pwd - MongoDB password
 * @property {string} db.auth_mechanism - MongoDB authentication mechanism
 * @property {string} db.auth_source - MongoDB authentication database
 */
module.exports = {
  discord: {
    token: process.env.discord_token,
    client_id: process.env.discord_client_id,
    log_guild_id: process.env.discord_log_guild_id,
    log_channel_id: process.env.discord_log_channel_id,
  },
  db: {
    cluster_url: process.env.db_cluster_url,
    port: process.env.db_port,
    user: process.env.db_user,
    pwd: process.env.db_pwd,
    auth_mechanism: process.env.db_auth_mechanism,
    auth_source: process.env.db_auth_source,
  },
};
