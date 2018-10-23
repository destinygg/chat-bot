const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const parseDurationToSeconds = require('../../chat-utils/duration-parser');
const { makeMute } = require('../../chat-utils/punishment-helpers');

function nuke(input, services, rawMesasge) {
  const matched = /(\d+[hmds])?\s?(?:\/(.*)\/)?(.*)/.exec(input);
  const nukeWord = _.get(matched, 3).toLowerCase();
  const nukeRegex = _.get(matched, 2, '');
  const duration = _.get(matched, 1, '');
  let parsedDuration = 600;
  if (duration !== '') {
    parsedDuration = parseDurationToSeconds(duration);
    if (parsedDuration === null) {
      return new CommandOutput(null, 'Could not parse the duration. Usage: "!nuke {amount}{m,h,d,w} {some nuke phrase} " !nuke 1d GET GNOMED');
    }
  }

  const messageList = services.chatCache.runningMessageList;
  const userList = services.spamDetection.getUsersWithMatchedMessage(nukeRegex === '' ? nukeWord : new RegExp(nukeRegex, 'i'), messageList);
  const indexOfUser = userList.indexOf(rawMesasge.user);
  if (indexOfUser !== -1) {
    userList.splice(indexOfUser, 1);
  }
  services.punishmentCache.addNukeToAegis(userList);
  userList.forEach((user) => {
    services.punishmentStream.write(makeMute(user,
      parsedDuration, false));
  });
  return new CommandOutput(null, `Dropping the NUKE on ${userList.length} victims`);
}

module.exports = new Command(nuke, false, true, /(\d+[hmds])?\s?(?:\/(.*)\/)?(.*)/, false);
