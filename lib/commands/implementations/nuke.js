const _ = require('lodash');
const moment = require('moment');

const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const parseDurationToSeconds = require('../../chat-utils/duration-parser');
const { makeMute, makeBan } = require('../../chat-utils/punishment-helpers');

function nuke(isMegaNuke) {
  return (input, services, rawMessage) => {
    const matched = /(\d+[HMDSWwhmds])?\s?(?:\/(.*)\/)?(.*)/.exec(input);
    const nukeWord = _.get(matched, 3).toLowerCase();
    const nukeRegex = _.get(matched, 2, '');
    const duration = _.get(matched, 1, '');
    let parsedDuration = 600;
    if (duration !== '') {
      parsedDuration = parseDurationToSeconds(duration);
      if (parsedDuration === null) {
        return new CommandOutput(
          null,
          'Could not parse the duration. Usage: "!nuke {amount}{m,h,d,w} {some nuke phrase} " !nuke 1d GET GNOMED',
        );
      }
    }
    const wordToMute =
      nukeRegex === '' ? new RegExp(`\\b${nukeWord}\\b`, 'i') : new RegExp(nukeRegex, 'i');
    const now = moment().unix();

    const messageList = services.chatCache.runningMessageList.filter((userPost) => {
      const inMap = _.get(userPost, 'timeStamp', false);

      if (inMap === false) {
        return false;
      }
      // Only users from a minute ago.
      return now - inMap <= 60;
    });
    const userList = services.spamDetection.getUsersWithMatchedMessage(wordToMute, messageList);
    const indexOfUser = userList.indexOf(rawMessage.user);
    if (indexOfUser !== -1) {
      userList.splice(indexOfUser, 1);
    }
    services.punishmentCache.addNukeToCache(userList, wordToMute, parsedDuration, isMegaNuke);
    userList.forEach((user) => {
      const punishment = isMegaNuke
        ? makeBan(
            user,
            parsedDuration,
            true,
            false,
            `MEGA NUKED by ${rawMessage.user}`,
            false,
            true,
          )
        : makeMute(user, parsedDuration, false);

      services.punishmentStream.write(punishment);
    });
    return new CommandOutput(null, `Dropping the NUKE on ${userList.length} victims`);
  };
}

module.exports = {
  megaNuke: new Command(nuke(true), false, true, /(\d+[HMDSWwhmds])?\s?(?:\/(.*)\/)?(.*)/, false),
  nuke: new Command(nuke(false), false, true, /(\d+[HMDSWwhmds])?\s?(?:\/(.*)\/)?(.*)/, false),
};
