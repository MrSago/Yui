/**
 * @file Main application entry point
 * @description Discord bot initialization and startup
 */

const config = require("./environment.js").discord;
const logger = require("./logger.js");
const { initializeClient } = require("./discord");

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection:", reason);
  process.exit(1);
});

(async () => {
  try {
    logger.info("=".repeat(50));
    logger.info("Starting Yui Discord Bot...");
    logger.info("=".repeat(50));

    logger.info("Initializing Discord client...");
    const client = await initializeClient(config);

    logger.info("Logging in to Discord...");
    await client.login(config.token);

    logger.info("Login successful!");
  } catch (error) {
    logger.error("❌ Failed to start bot:");
    logger.error(error);
    process.exit(1);
  }
})();
