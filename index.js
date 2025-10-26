/**
 * @file Main application entry point
 * @description Discord bot initialization and startup
 */

const config = require("./environment.js").discord;
const logger = require("./logger.js");
const { initializeClient } = require("./discord");

(async () => {
  try {
    const client = await initializeClient(config);
    await client.login(config.token);
  } catch (error) {
    logger.error("Failed to start bot:", error);
    process.exit(1);
  }
})();
