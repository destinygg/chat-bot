/**
 * @param {URL} url A URL object
 * @returns {string} The normalized URL
 */
function normalizeUrl(url) {
  return url.hostname + url.pathname;
}

module.exports = normalizeUrl;
