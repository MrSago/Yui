const logger = require("./logger.js");

const puppeteer = require("puppeteer");
const { default: Bottleneck } = require("bottleneck");

const limiter = new Bottleneck({ maxConcurrent: 1, minTime: 1000 });

async function initBrowser() {
  logger.debug("Init new browser");
  return await puppeteer.launch({
    headless: false,
  });
}

async function browserGet(browser, url) {
  if (!browser) {
    logger.warn("Browser is not init!");
    return null;
  }

  const result = await limiter.schedule(() => getWrapper(browser, url));
  return result;
}

async function getWrapper(browser, url) {
  logger.debug(`Browser get started with url: ${url}`);

  let page = await browser.newPage();
  await page.goto(url, {
    waitUntil: "networkidle0",
  });

  const result = await page.evaluate(() => {
    let result = null;
    try {
      result = JSON.parse(document.querySelector("body").textContent);
    } catch (err) {
      logger.error(err);
    }
    return result;
  });

  page.close();

  logger.debug(`Browser get ended with url:   ${url}`);
  return result;
}

module.exports = {
  initBrowser: initBrowser,
  browserGet: browserGet,
};
