const moment = require('moment');
const formatDuration = require('../chat-utils/format-duration');
const parseDurationToSeconds = require('../chat-utils/duration-parser');

module.exports = {
  parseInput(input, defaultBanTime) {
    const splitInput = input.split(' ');
    const timeParse = /^((?:\d+[HMDSWwhmds])|(?:perm))$/;
    const timeDoesParse = timeParse.test(splitInput[0]);

    const isPermanent = (timeDoesParse ? splitInput[0] : defaultBanTime).toLowerCase() === 'perm';
    const parsedDuration = timeDoesParse ? parseDurationToSeconds(splitInput[0]) : defaultBanTime;

    const muteString = isPermanent
      ? 'PERMANENTLY'
      : formatDuration(moment.duration(parsedDuration, 'seconds'));

    const users = timeDoesParse ? splitInput.slice(1) : splitInput;

    return {
      isPermanent,
      parsedDuration: isPermanent ? 0 : parsedDuration,
      muteString: muteString.trim(),
      users,
    };
  },
};
