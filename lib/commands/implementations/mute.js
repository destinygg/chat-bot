const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const parseDurationToSeconds = require('../../chat-utils/duration-parser');
const { makeMute } = require('../../chat-utils/punishment-helpers');

function mute(input, services) {
  const matched = /(\w+) (\d+[hmds])/.exec(input);
  const userToUnmute = _.get(matched, 1, '').toLowerCase();
  const duration = _.get(matched, 2, '').toLowerCase();
  const parsedDuration = parseDurationToSeconds(duration);
  if (parsedDuration === null) {
    return new CommandOutput(null, null, 'Could not parse the duration. Usage: "!mute {user} {amount}{m,h,d,w}" !mute Destiny 1d');
  }
  services.punishmentStream.write(makeMute(userToUnmute, parsedDuration, `Muting: ${userToUnmute} for ${duration}`));
  return new CommandOutput(null, null, null);
}

module.exports = new Command(mute, false, true, /(\w+) (\d+[hmds])/, null);
