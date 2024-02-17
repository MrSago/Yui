const logger = require("./logger.js");

const puppeteer = require("puppeteer");
const { default: Bottleneck } = require("bottleneck");

const limiter = new Bottleneck({ maxConcurrent: 1, minTime: 100 });

var browser;
var page;

async function init() {
  browser = await puppeteer.launch({
    headless: false,
  });

  page = await browser.newPage();
}

async function browserGet(url) {
  return await limiter.schedule(() => getWrapper(url));
}

async function getWrapper(url) {
  logger.debug(`Browser get started with url: ${url}`);
  await page.goto(url, {
    waitUntil: "networkidle0",
  });

  const result = await page.evaluate(() => {
    return JSON.parse(document.querySelector("body").textContent);
  });

  logger.debug(`Browser get ended with url:   ${url}`);
  return result;
}

module.exports = {
  init: init,
  browserGet: browserGet,
};
