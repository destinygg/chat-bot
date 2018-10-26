const _ = require('lodash');
const parseDurationToSeconds = require('../chat-utils/duration-parser');

// Durations in seconds
function basePunishmentHelper(input, defaultDuration, overRideDuration) {
  const matched = /(\d+[hmds])?\s?(\w+)(?:\s(.*))?/.exec(input);
  const userToPunish = _.get(matched, 2, '').toLowerCase();
  let parsedDuration = 0;
  let isPermanent = false;
  if (overRideDuration === undefined) {
    const matchedDuration = _.get(matched, 1, '').toLowerCase();
    switch (matchedDuration) {
      case '':
        parsedDuration = defaultDuration;
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
  return { userToPunish, parsedDuration, parsedReason, isPermanent };
}

module.exports = basePunishmentHelper;
