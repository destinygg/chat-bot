const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const parseDurationToSeconds = require('../../chat-utils/duration-parser');
const { makeMute } = require('../../chat-utils/punishment-helpers');

function nuke(input, services) {
  const matched = /(.*) (\d+[hmds]$)/.exec(input);
  const nukeWord = _.get(matched, 1).toLowerCase();
  const duration = _.get(matched, 2, '').toLowerCase();
  const parsedDuration = parseDurationToSeconds(duration);
  if (parsedDuration === null) {
    return new CommandOutput(null, null, 'Could not parse the duration. Usage: "!nuke {some nuke phrase} {amount}{m,h,d,w}" !nuke GET GNOMED 1d');
  }
  const messageList = services.chatCache.runningMessageList;
  const userList = services.spamDetection.getUsersWithMatchedMessage(nukeWord, messageList);

  userList.forEach((user) => {
    services.punishmentStream.write(makeMute(user,
      parsedDuration, false));
  });
  return new CommandOutput(null, null, `Dropping the NUKE on ${userList.length - 1} victims`);
}

module.exports = new Command(nuke, false, false, /(.*) (\d+[hmds]$)/, false);
