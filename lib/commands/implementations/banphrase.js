const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const parseDurationToSeconds = require('../../chat-utils/duration-parser');

function banPhraseTwitch(defaultPunishmentDuration, punishmentType) {
  return (input, services) => {
    if (!input) {
      return new CommandOutput(
        null,
        'No arguments provided. Usage: "!addX {amount}{m,h,d,w} {some banned phrase}" !addban 1d OBAMNA LULW',
      );
    }
    const matched = /(\d+[HMDSWwhmds])?\s?(.*)/.exec(input);
    const duration = _.get(matched, 1, '');
    const bannedPhrase = _.get(matched, 2, '').toLowerCase();
    let parsedDuration = defaultPunishmentDuration;

    if (duration !== '') {
      parsedDuration = parseDurationToSeconds(duration);
      if (parsedDuration === null) {
        return Promise.resolve(
          new CommandOutput(
            null,
            'Could not parse the duration. Usage: "!AddX {amount}{m,h,d,w} {some banned phrase}" !AddMute 1d YOU BEEN GNOMED',
          ),
        );
      }
    }

    if (/^\/.*\/$/.test(bannedPhrase)) {
      try {
        // eslint-disable-next-line no-new
        new RegExp(bannedPhrase);
      } catch (e) {
        return Promise.resolve(new CommandOutput(null, 'Could not add phrase. Invalid Regex.'));
      }
    }

    return services.sql
      .addBannedPhrase(bannedPhrase, parsedDuration, punishmentType)
      .then(() => {
        services.spamDetection.addBannedPhrase({
          text: bannedPhrase,
          duration: parsedDuration,
          type: punishmentType,
        });
        return new CommandOutput(null, 'Phrase banned!');
      })
      .catch((err) => {
        if (err.errno === 19) {
          return new CommandOutput(null, 'Phrase already banned!');
        }
        return new CommandOutput(err, 'Oops. Something did not work. Check the logs.');
      });
  };
}

function banPhraseDGG() {
  return (input, services) => {
    if (!input) {
      return new CommandOutput(
        null,
        'No arguments provided. Usage: "!addX {some banned phrase}" !addban OBAMNA LULW',
      );
    }
    const matched = /(\d+[HMDSWwhmds])?\s?(.*)/.exec(input);
    const bannedPhrase = _.get(matched, 2, '').toLowerCase();
    if (bannedPhrase.length === 0) {
      return new CommandOutput(
        null,
        'No phrase provided. Usage: "!addX {some banned phrase}" !addban OBAMNA LULW',
      );
    }
    services.bannedPhrases.addBannedPhrase(bannedPhrase);
    return new CommandOutput(null, 'Phrase banned!');
  };
}

module.exports = {
  addbanTwitch: new Command(
    banPhraseTwitch(1800, 'ban'),
    true,
    true,
    /(\d+[HMDSWwhmds])?\s?(.*)/,
    false,
  ),
  addmuteTwitch: new Command(
    banPhraseTwitch(600, 'mute'),
    true,
    true,
    /(\d+[HMDSWwhmds])?\s?(.*)/,
    false,
  ),
  addbanDGG: new Command(banPhraseDGG(), false, true, /(\d+[HMDSWwhmds])?\s?(.*)/, false),
};
