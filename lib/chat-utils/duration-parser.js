const _ = require('lodash');

const timeMapping = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
};

/**
 * @param {string} durationString
 */
function parseDurationToSeconds(durationString) {
  const matched = /(\d+)([whmds])/.exec(durationString.toLowerCase());
  const multiplier = _.get(matched, 1, null);
  const timeUnit = _.get(matched, 2, null);

  if (timeMapping[timeUnit] === undefined || multiplier === null || timeUnit === null) {
    return null;
  }

  return multiplier * timeMapping[timeUnit];
}

module.exports = parseDurationToSeconds;
