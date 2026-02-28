const fs = require("fs");

const db = require("../db/database.js");
const logger = require("../logger.js").child({ module: "loot/lootScreenshot" });
const sirusApi = require("../api/sirusApi.js");

let puppeteerModule = null;
let browserPromise = null;
let screenshotQueue = Promise.resolve();
let cachedStyles = null;
let isBrowserClosing = false;

const TOOLTIP_SELECTOR = ".s-tooltip-detail";
const TOOLTIP_RETRY_ATTEMPTS = 2;
const STYLE_SELECTOR = 'link[rel="stylesheet"]';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveChromiumExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const commonPaths = [
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
  ];

  for (const path of commonPaths) {
    try {
      fs.accessSync(path);
      return path;
    } catch {
      continue;
    }
  }

  return undefined;
}

async function getTooltipData(page, itemEntry, realmId) {
  logger.debug(
    `Loot screenshot: loading tooltip data for item ${itemEntry} on realm ${realmId}`,
  );

  const cached = await db.getLootTooltipCache(itemEntry);
  if (cached?.tooltip_html) {
    logger.debug(
      `Loot screenshot: cache hit for item ${itemEntry}, using stored tooltip html`,
    );
    return { tooltipHtml: cached.tooltip_html, styles: null };
  }

  const itemUrl = sirusApi.getItemUrl(itemEntry, realmId);

  for (let attempt = 1; attempt <= TOOLTIP_RETRY_ATTEMPTS; attempt += 1) {
    try {
      logger.debug(
        `Loot screenshot: opening item page (attempt ${attempt}/${TOOLTIP_RETRY_ATTEMPTS}) ${itemUrl}`,
      );

      await page.goto(itemUrl, {
        waitUntil: "networkidle2",
        timeout: 15000,
      });

      await page.waitForSelector(TOOLTIP_SELECTOR, { timeout: 6000 });

      const styles = await page.$$eval(STYLE_SELECTOR, (links) =>
        links.map((link) => link.href),
      );

      const tooltipHtml = await page.$eval(
        TOOLTIP_SELECTOR,
        (el) => el.outerHTML,
      );

      await db.saveLootTooltipCache(itemEntry, tooltipHtml);
      logger.debug(
        `Loot screenshot: tooltip captured and cached for item ${itemEntry}`,
      );

      return { tooltipHtml, styles };
    } catch (error) {
      if (attempt === TOOLTIP_RETRY_ATTEMPTS) {
        logger.warn(
          `Tooltip render data unavailable for item ${itemEntry} on realm ${realmId}: ${error.message}`,
        );
        return null;
      }

      await sleep(500 * attempt);
    }
  }

  return null;
}

async function getStyles(page, realmId, fallbackItemEntry) {
  if (cachedStyles && cachedStyles.length > 0) {
    logger.debug(
      `Loot screenshot: using ${cachedStyles.length} cached stylesheet links`,
    );
    return cachedStyles;
  }

  if (!fallbackItemEntry) {
    return [];
  }

  const itemUrl = sirusApi.getItemUrl(fallbackItemEntry, realmId);
  logger.debug(
    `Loot screenshot: resolving styles from fallback item ${fallbackItemEntry} (${itemUrl})`,
  );
  await page.goto(itemUrl, {
    waitUntil: "networkidle2",
    timeout: 15000,
  });

  const styles = await page.$$eval('link[rel="stylesheet"]', (links) =>
    links.map((link) => link.href),
  );

  if (styles.length > 0) {
    cachedStyles = styles;
    logger.debug(
      `Loot screenshot: cached ${styles.length} stylesheet links for subsequent renders`,
    );
  }

  return styles;
}

function buildTooltipGridHtml(tooltips, styles) {
  const columns = Math.min(tooltips.length, 3);

  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<base href="https://sirus.su/">

${styles.map((href) => `<link rel="stylesheet" href="${href}">`).join("\n")}

<style>
body {
  margin: 0;
  padding: 20px;
  background: #111;
}

.grid {
  display: grid;
  grid-template-columns: repeat(${columns}, auto);
  gap: 20px;
  width: max-content;
}
</style>

</head>
<body>
<div class="grid">
${tooltips.join("\n")}
</div>
</body>
</html>`;
}

async function renderTooltipGrid(page, html) {
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".grid");
  logger.debug("Loot screenshot: HTML grid rendered in browser page");

  await page
    .waitForNetworkIdle({ idleTime: 500, timeout: 30000 })
    .catch(() => undefined);
}

async function areStylesApplied(page) {
  return page.evaluate((tooltipSelector) => {
    const tooltip = document.querySelector(tooltipSelector);
    if (!tooltip) {
      return {
        applied: false,
        reason: "tooltip_not_found",
      };
    }

    const links = Array.from(
      document.querySelectorAll('link[rel="stylesheet"]'),
    );
    const loadedLinks = links.filter((link) => Boolean(link.sheet)).length;
    const textColor = window.getComputedStyle(tooltip).color;
    const applied = links.length > 0 && loadedLinks > 0 && textColor !== "rgb(0, 0, 0)";

    return {
      applied,
      reason: applied ? null : "style_check_failed",
      textColor,
      stylesTotal: links.length,
      stylesLoaded: loadedLinks,
    };
  }, TOOLTIP_SELECTOR);
}

async function createLootScreenshotBuffer(lootItems, realmId) {
  logger.debug(
    `Loot screenshot: queued render request (realm=${realmId}, items=${lootItems?.length ?? 0})`,
  );

  const currentTask = screenshotQueue.then(() =>
    createLootScreenshotBufferInternal(lootItems, realmId),
  );

  screenshotQueue = currentTask.catch(() => undefined);
  return currentTask;
}

function getPuppeteer() {
  if (puppeteerModule) {
    return puppeteerModule;
  }

  try {
    puppeteerModule = require("puppeteer");
    return puppeteerModule;
  } catch (error) {
    logger.warn({ err: error }, "Puppeteer is not available:");
    return null;
  }
}

async function getBrowser() {
  if (browserPromise) {
    return browserPromise;
  }

  const puppeteer = getPuppeteer();
  if (!puppeteer) {
    return null;
  }

  browserPromise = puppeteer
    .launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: resolveChromiumExecutablePath(),
      handleSIGINT: false,
      handleSIGTERM: false,
      handleSIGHUP: false,
    })
    .then((browser) => {
      browser.on("disconnected", () => {
        browserPromise = null;
      });
      return browser;
    })
    .catch((error) => {
      browserPromise = null;
      throw error;
    });

  return browserPromise;
}

async function closeBrowser() {
  if (!browserPromise || isBrowserClosing) {
    return;
  }

  isBrowserClosing = true;

  try {
    const browser = await browserPromise;
    const browserProcess = browser.process?.();

    await browser.close();

    if (browserProcess?.pid) {
      try {
        process.kill(browserProcess.pid, 0);
        browserProcess.kill("SIGKILL");
      } catch {
        // process already exited
      }
    }
  } catch {
    // ignore shutdown errors
  } finally {
    browserPromise = null;
    cachedStyles = null;
    isBrowserClosing = false;
  }
}

process.once("beforeExit", () => {
  closeBrowser().catch(() => undefined);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    closeBrowser()
      .catch(() => undefined)
      .finally(() => {
        process.exit(0);
      });
  });
}

async function createLootScreenshotBufferInternal(lootItems, realmId) {
  if (!lootItems || lootItems.length === 0) {
    logger.debug("Loot screenshot: no loot items to render");
    return null;
  }

  logger.debug(
    `Loot screenshot: starting render pipeline for ${lootItems.length} items on realm ${realmId}`,
  );

  const browser = await getBrowser();
  if (!browser) {
    logger.warn("Loot screenshot: browser is unavailable, render skipped");
    return null;
  }

  let page;
  const numericRealmId = Number(realmId);

  try {
    page = await browser.newPage();
    logger.debug("Loot screenshot: new page created");

    let styles = await getStyles(page, numericRealmId, lootItems[0]?.entry);
    const tooltips = [];

    for (const item of lootItems) {
      logger.debug(
        { item_entry: item.entry },
        "Loot screenshot: rendering tooltip for item",
      );
      const data = await getTooltipData(page, item.entry, numericRealmId);

      if (!data?.tooltipHtml) {
        continue;
      }

      tooltips.push(data.tooltipHtml);
      logger.debug(
        `Loot screenshot: tooltip appended for item ${item.entry} (total=${tooltips.length})`,
      );

      if (styles.length === 0 && data.styles?.length > 0) {
        styles = data.styles;
        cachedStyles = styles;
      }
    }

    if (tooltips.length === 0) {
      logger.warn("No tooltip blocks were rendered, skipping loot screenshot");
      return null;
    }

    let html = buildTooltipGridHtml(tooltips, styles);
    await renderTooltipGrid(page, html);

    let styleCheck = await areStylesApplied(page);
    if (!styleCheck.applied) {
      logger.warn(
        { style_check: styleCheck },
        "Loot screenshot: styles look unapplied, refreshing stylesheet links and retrying once",
      );

      cachedStyles = null;
      styles = await getStyles(page, numericRealmId, lootItems[0]?.entry);

      if (!styles || styles.length === 0) {
        logger.warn(
          "Loot screenshot: no styles available after refresh, sending message without screenshot",
        );
        return null;
      }

      html = buildTooltipGridHtml(tooltips, styles);
      await renderTooltipGrid(page, html);

      styleCheck = await areStylesApplied(page);
      if (!styleCheck.applied) {
        logger.warn(
          { style_check: styleCheck },
          "Loot screenshot: styles are still not applied, sending message without screenshot",
        );
        return null;
      }
    }

    const size = await page.evaluate(() => {
      const el = document.querySelector(".grid");
      const rect = el.getBoundingClientRect();
      return {
        width: Math.ceil(rect.width) + 40,
        height: Math.ceil(rect.height) + 40,
      };
    });

    await page.setViewport({
      width: size.width,
      height: size.height,
      deviceScaleFactor: 1,
    });

    const screenshot = await page.screenshot({
      fullPage: true,
      type: "png",
    });

    logger.debug(
      `Loot screenshot: screenshot complete (${screenshot?.length ?? 0} bytes)`,
    );

    return screenshot;
  } catch (error) {
    logger.error({ err: error }, "Failed to render loot screenshot:");
    return null;
  } finally {
    if (page) {
      logger.debug("Loot screenshot: closing page");
      await page.close().catch(() => undefined);
    }
  }
}

async function clearLootTooltipCache() {
  cachedStyles = null;

  try {
    await db.clearLootTooltipCache();
  } catch (error) {
    logger.error({ err: error }, "Failed to clear loot tooltip cache:");
  }
}

module.exports = {
  createLootScreenshotBuffer,
  clearLootTooltipCache,
  closeLootScreenshotBrowser: closeBrowser,
};
