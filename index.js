/**
 * @file Main application entry point
 * @description Discord bot initialization and startup
 */

const db = require("./db/database.js");
const { initializeClient } = require("./discord/index.js");
const { discord: env } = require("./environment.js");
const logger = require("./logger.js");

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
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

    logger.info("Initializing database...");
    await db.init();

    logger.info("Initializing Discord client...");
    const client = await initializeClient(env);

    logger.info("Logging in to Discord...");
    await client.login(env.token);

    logger.info("Login successful!");
  } catch (error) {
    logger.error("❌ Failed to start bot:");
    logger.error(error);
    process.exit(1);
  }
})();
