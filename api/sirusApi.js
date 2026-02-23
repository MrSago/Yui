const axios = require("axios");
const bottleneck = require("bottleneck");

const { sirus: config } = require("../config/index.js");
const logger = require("../logger.js").child({ module: "api/sirusApi" });

// Realm names mapping
const REALM_NAMES = {
  9: "Scourge x2",
  22: "Neverest x3",
  42: "Soulseeker x1",
  57: "Sirus x5",
};

// API URLs
const CHANGELOG_API_URL = "https://sirus.su/api/statistic/changelog";
const API_BASE_URL = "https://sirus.su/api/base";
const LATEST_FIGHTS_API = "progression/pve/latest-boss-kills";
const BOSS_KILL_API = "details/bossfight";

// Public URLs
const ITEM_URL = "https://sirus.su/base/item";
const GUILDS_URL = "https://sirus.su/base/guilds";
const PVE_PROGRESS_URL = "https://sirus.su/base/pve-progression/boss-kill";
const CHANGELOG_URL = "https://sirus.su/statistic/changelog";

// Default headers for requests
const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.7,ru;q=0.3",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "cross-site",
};

const CACHE_TTL_MS = 1000 * 60;
const responseCache = new Map();

function getCachedResponse(cacheKey) {
  const cached = responseCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    responseCache.delete(cacheKey);
    return null;
  }

  return cached.value;
}

function setCachedResponse(cacheKey, value) {
  responseCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

// Initialize Bottleneck rate limiter
const apiLimiter = new bottleneck({
  minTime: config.apiLimiter.minTime,
  maxConcurrent: config.apiLimiter.maxConcurrent,
});

/**
 * Get changelog from Sirus.su
 * @returns {Promise<Object|null>} Changelog data or null on error
 */
async function getChangelog() {
  logger.info({ url: CHANGELOG_API_URL }, "Fetching changelog");
  const data = await makeGetRequest(CHANGELOG_API_URL);

  if (!data) {
    logger.warn("Failed to get changelog from Sirus.su");
    return null;
  }

  return data;
}

/**
 * Get latest boss kills for a guild
 * @param {number} realmId - Realm ID
 * @param {number} guildSirusId - Guild ID on Sirus
 * @returns {Promise<Array|null>} Array of boss kills or null on error
 */
async function getLatestBossKills(realmId, guildSirusId) {
  const url = `${API_BASE_URL}/${realmId}/${LATEST_FIGHTS_API}?guild=${guildSirusId}&lang=ru`;
  logger.info(
    `Fetching latest boss kills for guild ${guildSirusId} on realm ${realmId}`,
  );

  const data = await makeGetRequest(url);

  if (!data) {
    logger.warn(
      `Failed to get latest boss kills for guild ${guildSirusId} on realm ${realmId}`,
    );
    return null;
  }

  return data;
}

/**
 * Get detailed information about a boss kill
 * @param {number} realmId - Realm ID
 * @param {number} recordId - Boss kill record ID
 * @returns {Promise<Object|null>} Boss kill details or null on error
 */
async function getBossKillDetails(realmId, recordId) {
  const url = `${API_BASE_URL}/${realmId}/${BOSS_KILL_API}/${recordId}?lang=ru`;
  logger.info(
    `Fetching boss kill details for record ${recordId} on realm ${realmId}`,
  );

  const data = await makeGetRequest(url);

  if (!data) {
    logger.warn(
      `Failed to get boss kill details for record ${recordId} on realm ${realmId}`,
    );
    return null;
  }

  return data;
}

/**
 * Build item URL
 * @param {number} itemEntry - Item entry ID
 * @param {number} realmId - Realm ID
 * @returns {string} Item URL
 */
function getItemUrl(itemEntry, realmId) {
  return `${ITEM_URL}/${itemEntry}/${realmId}`;
}

/**
 * Build guild URL
 * @param {number} realmId - Realm ID
 * @param {number} guildId - Guild ID
 * @returns {string} Guild URL
 */
function getGuildUrl(realmId, guildId) {
  return `${GUILDS_URL}/${realmId}/${guildId}`;
}

/**
 * Build PVE progress URL for boss kill
 * @param {number} realmId - Realm ID
 * @param {number} recordId - Boss kill record ID
 * @returns {string} PVE progress URL
 */
function getPveProgressUrl(realmId, recordId) {
  return `${PVE_PROGRESS_URL}/${realmId}/${recordId}`;
}

/**
 * Get changelog page URL
 * @returns {string} Changelog URL
 */
function getChangelogUrl() {
  return CHANGELOG_URL;
}

/**
 * Get realm name by ID
 * @param {number} realmId - Realm ID
 * @returns {string|null} Realm name or null if not found
 */
function getRealmNameById(realmId) {
  return REALM_NAMES[realmId] || null;
}

/**
 * Wrapper for axios GET requests with rate limiting
 * @param {string} url - Full URL to request
 */
async function limitedGet(url, options = {}) {
  return apiLimiter.schedule(() => axios.get(url, options));
}

/** Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Makes a GET request to Sirus API
 * @param {string} url - Full URL to request
 * @param {Object} options - Additional axios options
 * @returns {Promise<Object|null>} Response data or null on error
 */
async function makeGetRequest(url, options = {}) {
  const axiosOptions = {
    headers: DEFAULT_HEADERS,
    timeout: config.axios.timeoutMs,
    cache: true,
    ...options,
  };

  const cacheKey = url;
  const cachedResponse = getCachedResponse(cacheKey);
  if (cachedResponse) {
    logger.debug({ url: url }, "Using cached API response:");
    return cachedResponse;
  }

  let attempt = 0;
  while (attempt <= config.axios.maxRetries) {
    try {
      logger.debug({ url, attempt: attempt + 1 }, "Making API request");
      const response = await limitedGet(url, axiosOptions);
      logger.debug({ url: url }, "API request successful:");
      setCachedResponse(cacheKey, response.data);
      return response.data;
    } catch (error) {
      attempt += 1;

      // Determine if error is retryable: network error, timeout, 5xx or 429
      const status = error && error.response && error.response.status;
      const isNetworkError = !error.response;
      const isTimeout = error && error.code === "ECONNABORTED";
      const isRetryableStatus = status >= 500 || status === 429;

      if (
        attempt > config.axios.maxRetries ||
        (!isNetworkError && !isTimeout && !isRetryableStatus)
      ) {
        logger.error(
          `Sirus API request failed: ${url} after ${attempt} attempts`,
        );
        logger.error({ err: error }, "Error details:");
        if (error.response) {
          logger.error({ status: error.response.status, url }, "Response status");
        }
        return null;
      }

      const backoff = Math.min(
        config.backoff.maxMs,
        config.backoff.baseMs * Math.pow(2, attempt - 1),
      );
      const jitter = Math.floor(Math.random() * backoff);
      const waitMs = backoff + jitter;

      logger.warn({ url, status }, "Transient error on request");
      logger.warn(
        `Retrying in ${waitMs} ms (attempt ${attempt} of ${config.axios.maxRetries})`,
      );

      await sleep(waitMs);
    }
  }
  return null;
}

module.exports = {
  getChangelog,
  getLatestBossKills,
  getBossKillDetails,
  getItemUrl,
  getGuildUrl,
  getPveProgressUrl,
  getChangelogUrl,
  getRealmNameById,
};
