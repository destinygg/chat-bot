const _ = require('lodash');
const parseDurationToSeconds = require('../chat-utils/duration-parser');

// Durations in seconds
/**
 * @param {string} input
 * @param {number | 'perm'} defaultBanTime
 * @param {number} [overRideDuration]
 */
function basePunishmentHelper(input, defaultBanTime, overRideDuration) {
  const matched = /((?:\d+[HMDSWwhmds])\s+|(?:perm)\s+)?\s?(\w+(?:\s*,\s*\w+)*)(?:\s(.*))?/.exec(
    input,
  );
  const usersToPunish = _.get(matched, 2, '')
    .toLowerCase()
    .split(',')
    .map((x) => x.trim());
  let parsedDuration = 0;
  let isPermanent = false;
  if (overRideDuration === undefined) {
    const matchedDuration = _.get(matched, 1, '').toLowerCase();
    switch (matchedDuration) {
      case '':
        if (defaultBanTime === 'perm') {
          isPermanent = true;
        } else {
          parsedDuration = defaultBanTime;
        }
        break;
      case 'perm':
        isPermanent = true;
        break;
      default:
        parsedDuration = parseDurationToSeconds(matchedDuration);
        if (parsedDuration === null) {
          return false;
        }
        break;
    }
  } else {
    parsedDuration = overRideDuration;
  }

  const parsedReason = _.get(matched, 3, null);
  return usersToPunish.map((userToPunish) => ({
    userToPunish,
    parsedDuration,
    parsedReason,
    isPermanent,
  }));
}

module.exports = basePunishmentHelper;
