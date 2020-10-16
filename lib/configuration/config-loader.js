const fs = require('fs');
const _ = require('lodash');

/**
 * @param {import('fs').PathLike} filePath
 * @returns {import("../configuration/sample.config.json") | null}
 */
function loadConfig(filePath) {
  if (_.isEmpty(filePath)) {
    return JSON.parse(fs.readFileSync(`${__dirname}/prod.config.json`, 'utf8'));
  }

  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  return null;
}

module.exports = loadConfig;
