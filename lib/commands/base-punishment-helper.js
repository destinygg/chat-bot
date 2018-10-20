const _ = require('lodash');
const parseDurationToSeconds = require('../chat-utils/duration-parser');

// Durations in seconds
function basePunishmentHelper(input, defaultDuration, overRideDuration) {
  const matched = /(\d+[hmds])?\s?(\w+)/.exec(input);
  const userToPunish = _.get(matched, 2, '').toLowerCase();
  let parsedDuration = 0;
  if (parsedDuration !== false) {
    parsedDuration = _.get(matched, 1, '').toLowerCase();
    switch (parsedDuration) {
      case '':
        parsedDuration = defaultDuration;
        break;
      default:
        parsedDuration = parseDurationToSeconds(parsedDuration);
        if (parsedDuration === null) {
          return false;
        }
        break;
    }
  } else {
    parsedDuration = overRideDuration;
  }
  return { userToPunish, parsedDuration };
}

module.exports = basePunishmentHelper;
