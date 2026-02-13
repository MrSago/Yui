/**
 * @file Main application entry point
 * @description Discord bot initialization and startup
 */

const db = require("./db/database.js");
const { initializeClient } = require("./discord/index.js");
const { discord: env } = require("./environment.js");
const logger = require("./logger.js");
const { closeLootScreenshotBrowser } = require("./loot/lootScreenshot.js");

let isShuttingDown = false;

async function shutdownAndExit(code, label, error) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  if (label) {
    console.error(label, error);
  }

  try {
    await closeLootScreenshotBrowser();
  } catch {
    // ignore shutdown errors
  } finally {
    process.exit(code);
  }
}

process.on("uncaughtException", (err) => {
  void shutdownAndExit(1, "Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  void shutdownAndExit(1, "Unhandled Rejection:", reason);
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
    await shutdownAndExit(1);
  }
})();
