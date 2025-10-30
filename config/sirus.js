/**
 * @file Configuration for Sirus API and rate limiting
 * @description Settings for Sirus API rate limiting and axios configuration
 */

module.exports = {
  apiLimiter: {
    minTime: 333,
    maxConcurrent: 2,
  },

  axios: {
    timeoutMs: 10000,
    maxRetries: 3,
  },

  backoff: {
    baseMs: 300,
    maxMs: 2000,
  },
};
