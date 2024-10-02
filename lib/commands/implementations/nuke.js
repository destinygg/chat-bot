const _ = require('lodash');
const moment = require('moment');

const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const parseDurationToSeconds = require('../../chat-utils/duration-parser');
const { makeMute, makeBan } = require('../../chat-utils/punishment-helpers');

function nuke(commandType) {
  return (input, services, rawMessage) => {
    const matched = /(\d+[HMDSWwhmds])?\s?(?:\/(.*)\/)?(.*)/.exec(input);
    let nukeWord = _.get(matched, 3).toLowerCase();
    if (commandType === 'jdam') {
      nukeWord = new RegExp(`\\b${nukeWord}\\b`, 'i');
    }
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
    const wordToMute = nukeRegex === '' ? nukeWord : new RegExp(nukeRegex, 'i');
    const now = moment().unix();

    const messageList = services.chatCache.runningMessageList.filter((userPost) => {
      const inMap = _.get(userPost, 'timeStamp', false);

      if (inMap === false) {
        return false;
      }
      // Only users from 2 minutes ago.
      return now - inMap <= 120;
    });
    const userList = services.spamDetection.getUsersWithMatchedMessage(wordToMute, messageList);
    const indexOfUser = userList.indexOf(rawMessage.user);
    if (indexOfUser !== -1) {
      userList.splice(indexOfUser, 1);
    }
    services.punishmentCache.addNukeToCache(
      userList,
      wordToMute,
      parsedDuration,
      commandType !== 'nuke',
    );
    userList.forEach((user) => {
      let punishment;

      switch (commandType) {
        case 'meganuke':
          punishment = makeBan(
            user,
            parsedDuration,
            true,
            false,
            `MEGA NUKED by ${rawMessage.user}`,
            false,
            true,
          );
          break;
        case 'jdam':
          punishment = makeBan(
            user,
            parsedDuration,
            true,
            false,
            `JDAMed by ${rawMessage.user}`,
            false,
            true,
          );
          break;
        default:
          punishment = makeMute(user, parsedDuration, false);
          break;
      }

      services.punishmentStream.write(punishment);
    });
    return new CommandOutput(null, `Dropping the NUKE on ${userList.length} victims`);
  };
}

module.exports = {
  jdam: new Command(nuke('jdam'), false, true, /(\d+[HMDSWwhmds])?\s?(?:\/(.*)\/)?(.*)/, false),
  megaNuke: new Command(
    nuke('meganuke'),
    false,
    true,
    /(\d+[HMDSWwhmds])?\s?(?:\/(.*)\/)?(.*)/,
    false,
  ),
  nuke: new Command(nuke('nuke'), false, true, /(\d+[HMDSWwhmds])?\s?(?:\/(.*)\/)?(.*)/, false),
};
