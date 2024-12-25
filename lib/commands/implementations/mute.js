const moment = require('moment');

const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const { makeMute } = require('../../chat-utils/punishment-helpers');
const basePunishmentHelper = require('../base-punishment-helper');
const formatDuration = require('../../chat-utils/format-duration');

function mute(input, services) {
  const parsedInput = basePunishmentHelper(input, 600);
  if (parsedInput === false) {
    return new CommandOutput(
      null,
      'Could not parse the duration. Usage: "!mute {amount}{m,h,d,w} {user} " !mute 1d Destiny',
    );
  }
  parsedInput.forEach((result) => {
    const { userToPunish, parsedDuration } = result;
    services.punishmentStream.write(
      makeMute(
        userToPunish,
        parsedDuration,
        `Muting: ${userToPunish} for ${formatDuration(moment.duration(parsedDuration, 'seconds'))}`,
      ),
    );
  });
  return new CommandOutput(null, null);
}

module.exports = new Command(mute, false, true, /(\d+[HMDSWwhmds])?\s?(\w+)/, null);
