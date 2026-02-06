const fs = require("fs");

const db = require("../db/database.js");
const logger = require("../logger.js");
const sirusApi = require("../api/sirusApi.js");

let puppeteerModule = null;
let browserPromise = null;
let screenshotQueue = Promise.resolve();

function resolveChromiumExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const commonPaths = [
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
  ];

  for (const path of commonPaths) {
    try {
      fs.accessSync(path);
      return path;
    } catch (_) {
      continue;
    }
  }

  return undefined;
}

async function getTooltipData(page, itemEntry, realmId) {
  const cached = await db.getLootTooltipCache(itemEntry, realmId);
  if (cached?.tooltip_html) {
    return {
      tooltipHtml: cached.tooltip_html,
      styles: cached.styles || [],
    };
  }

  const itemUrl = sirusApi.getItemTooltipUrl(itemEntry, realmId);
  await page.goto(itemUrl, {
    waitUntil: "networkidle2",
    timeout: 15000,
  });

  const styles = await page.$$eval('link[rel="stylesheet"]', (links) =>
    links.map((link) => link.href),
  );

  const tooltipHtml = await page.$eval(".s-tooltip-detail", (el) => el.outerHTML);

  await db.saveLootTooltipCache(itemEntry, realmId, tooltipHtml, styles);

  return { tooltipHtml, styles };
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

async function createLootScreenshotBuffer(lootItems, realmId) {
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
    logger.warn(`Puppeteer is not available: ${error.message}`);
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
  if (!browserPromise) {
    return;
  }

  try {
    const browser = await browserPromise;
    await browser.close();
  } catch (_) {
    // ignore shutdown errors
  } finally {
    browserPromise = null;
  }
}

process.on("exit", closeBrowser);
process.on("SIGINT", closeBrowser);
process.on("SIGTERM", closeBrowser);

async function createLootScreenshotBufferInternal(lootItems, realmId) {
  if (!lootItems || lootItems.length === 0) {
    return null;
  }

  const browser = await getBrowser();
  if (!browser) {
    return null;
  }

  let page;

  try {
    page = await browser.newPage();

    const tooltips = [];
    let styles = [];

    for (const item of lootItems) {
      const data = await getTooltipData(page, item.entry, Number(realmId));
      tooltips.push(data.tooltipHtml);

      if (styles.length === 0 && data.styles.length > 0) {
        styles = data.styles;
      }
    }

    const html = buildTooltipGridHtml(tooltips, styles);

    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".grid");

    await page
      .waitForNetworkIdle({ idleTime: 500, timeout: 10000 })
      .catch(() => undefined);

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
      deviceScaleFactor: 2,
    });

    return await page.screenshot({
      fullPage: true,
      type: "png",
    });
  } catch (error) {
    logger.error(`Failed to render loot screenshot: ${error.message}`);
    return null;
  } finally {
    if (page) {
      await page.close().catch(() => undefined);
    }
  }
}

module.exports = {
  createLootScreenshotBuffer,
};
