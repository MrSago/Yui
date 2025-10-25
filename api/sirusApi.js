const axios = require("axios");
const logger = require("../logger.js");

// Realm names mapping
const REALM_NAMES = {
  9: "Scourge x2",
  22: "Neverest x3",
  33: "Algalon x4",
  42: "Soulseeker x1",
  57: "Sirus x5",
};

// API URLs
const CHANGELOG_API_URL = "https://sirus.su/api/statistic/changelog";
const API_BASE_URL = "https://sirus.su/api/base";
const LATEST_FIGHTS_API = "progression/pve/latest-boss-kills";
const BOSS_KILL_API = "details/bossfight";

// Public URLs
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

/**
 * Makes a GET request to Sirus API
 * @param {string} url - Full URL to request
 * @param {Object} options - Additional axios options
 * @returns {Promise<Object|null>} Response data or null on error
 */
async function makeRequest(url, options = {}) {
  try {
    const response = await axios.get(url, {
      headers: DEFAULT_HEADERS,
      cache: true,
      ...options,
    });
    return response.data;
  } catch (error) {
    logger.error(`Sirus API request failed: ${url}`);
    logger.error(error);
    return null;
  }
}

/**
 * Get changelog from Sirus.su
 * @returns {Promise<Object|null>} Changelog data or null on error
 */
async function getChangelog() {
  logger.info(`Fetching changelog from ${CHANGELOG_API_URL}`);
  const data = await makeRequest(CHANGELOG_API_URL);

  if (!data || !data.data) {
    logger.warn("Failed to get changelog from Sirus.su");
    return null;
  }

  return data.data;
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
    `Fetching latest boss kills for guild ${guildSirusId} on realm ${realmId}`
  );

  const data = await makeRequest(url);

  if (!data || !data.data) {
    logger.warn(
      `Failed to get latest boss kills for guild ${guildSirusId} on realm ${realmId}`
    );
    return null;
  }

  return data.data;
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
    `Fetching boss kill details for record ${recordId} on realm ${realmId}`
  );

  const data = await makeRequest(url);

  if (!data || !data.data) {
    logger.warn(
      `Failed to get boss kill details for record ${recordId} on realm ${realmId}`
    );
    return null;
  }

  return data.data;
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

module.exports = {
  getChangelog,
  getLatestBossKills,
  getBossKillDetails,
  getGuildUrl,
  getPveProgressUrl,
  getChangelogUrl,
  getRealmNameById,
};
