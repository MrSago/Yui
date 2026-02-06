const db = require("../db/database.js");
const logger = require("../logger.js");
const sirusApi = require("../api/sirusApi.js");

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
  if (!lootItems || lootItems.length === 0) {
    return null;
  }

  let puppeteer;
  try {
    puppeteer = require("puppeteer");
  } catch (error) {
    logger.warn(`Puppeteer is not available: ${error.message}`);
    return null;
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

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
    await browser.close();
  }
}

module.exports = {
  createLootScreenshotBuffer,
};
