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
 * @property {Object} app - Application configuration
 * @property {string} app.nodeEnv - Node environment (development, production)
 * @property {string} app.logLevel - Log level (error, warn, info, discord, debug)
 */
module.exports = {
  discord: {
    token: process.env.DISCORD_TOKEN,
    client_id: process.env.DISCORD_CLIENT_ID,
    log_guild_id: process.env.DISCORD_LOG_GUILD_ID,
    log_channel_id: process.env.DISCORD_LOG_CHANNEL_ID,
  },
  db: {
    cluster_url: process.env.DB_CLUSTER_URL,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    pwd: process.env.DB_PWD,
    auth_mechanism: process.env.DB_AUTH_MECHANISM,
    auth_source: process.env.DB_AUTH_SOURCE,
  },
  app: {
    nodeEnv: process.env.NODE_ENV || "development",
    logLevel: process.env.LOG_LEVEL || null,
  },
};
