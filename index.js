/**
 * @file Main application entry point
 * @description Discord bot initialization and startup
 */

const config = require("./environment.js").discord;
const logger = require("./logger.js");
const { initializeClient } = require("./discord");

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});

process.on("warning", (e) => {
  console.warn("Warning:", e.name, e.message, e.stack);
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
