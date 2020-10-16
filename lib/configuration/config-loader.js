const fs = require('fs');
const _ = require('lodash');

/**
 * @param {unknown} filePath
 * @returns {import("../configuration/sample.config.json") | null}
 */
function loadConfig(filePath) {
  if (_.isEmpty(filePath)) {
    return JSON.parse(fs.readFileSync(`${__dirname}/prod.config.json`, 'utf8'));
  }

  if (fs.existsSync(/** @type {import('fs').PathLike} */ (filePath))) {
    return JSON.parse(fs.readFileSync(/** @type {import('fs').PathLike} */ (filePath), 'utf8'));
  }

  return null;
}

module.exports = loadConfig;
