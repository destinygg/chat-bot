const _ = require('lodash');
const moment = require('moment');

const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const parseDurationToSeconds = require('../../chat-utils/duration-parser');
const { makeMute, makeBan } = require('../../chat-utils/punishment-helpers');
const ModerationState = require('../../services/moderation-state');

function nuke(isMegaNuke) {
  return (input, services, rawMessage) => {
    const matched = /(\d+[HMDSWwhmds])?\s?(?:\/(.*)\/)?(.*)/.exec(input);
    const inputPhrase = _.get(matched, 3, '').trim();
    const nukeRegex = _.get(matched, 2, '');
    const duration = _.get(matched, 1, '');
    const isRegex = nukeRegex !== '';
    const phrase = isRegex ? nukeRegex : inputPhrase;
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

    let wordToMute;
    try {
      wordToMute = ModerationState.compileNukeMatcher({ phrase, regex: isRegex });
    } catch (_error) {
      return new CommandOutput(null, 'Could not parse the nuke phrase.');
    }

    const now = moment().unix();

    const messageList = services.chatCache.runningMessageList.filter((userPost) => {
      const inMap = _.get(userPost, 'timeStamp', false);

      if (inMap === false) {
        return false;
      }
      // Only users from a minute ago.
      return now - inMap <= 60;
    });
    const victims = services.spamDetection
      .getUsersWithMatchedMessage(wordToMute, messageList)
      .filter(
        (victim) =>
          victim.nick.toLowerCase() !== rawMessage.user.toLowerCase() &&
          !(rawMessage.id && victim.id === rawMessage.id),
      );

    services.moderationState.addNuke({
      phrase,
      regex: isRegex,
      duration: parsedDuration,
      mega: isMegaNuke,
      by: rawMessage.user,
      victims,
    });

    victims.forEach((victim) => {
      const punishment = isMegaNuke
        ? makeBan(
            victim.nick,
            parsedDuration,
            true,
            false,
            `MEGA NUKED by ${rawMessage.user}`,
            false,
            true,
          )
        : makeMute(victim.nick, parsedDuration, false);

      services.punishmentStream.write(punishment);
    });
    return new CommandOutput(null, `Dropping the NUKE on ${victims.length} victims`);
  };
}

module.exports = {
  megaNuke: new Command(nuke(true), false, true, /(\d+[HMDSWwhmds])?\s?(?:\/(.*)\/)?(.*)/, false),
  nuke: new Command(nuke(false), false, true, /(\d+[HMDSWwhmds])?\s?(?:\/(.*)\/)?(.*)/, false),
};
