/**
 * @param {URL} url A URL object
 * @returns {string} The normalized URL
 */
function normalizeUrl(url) {
  // YouTube URLs require special handling because their unique identifier (video ID)
  // is in the query string rather than the path. Without preserving the 'v' parameter,
  // different videos would normalize to the same URL (youtube.com/watch).
  if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') {
    const videoId = url.searchParams.get('v');
    if (videoId) {
      return `youtube.com/watch?v=${videoId}`;
    }
  }

  return url.hostname + url.pathname;
}

module.exports = normalizeUrl;
