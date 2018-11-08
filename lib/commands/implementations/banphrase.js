const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const parseDurationToSeconds = require('../../chat-utils/duration-parser');

function banphrase(defaultPunishmentDuration, punishmentType) {
  return (input, services) => {
    const matched = /(\d+[hmds])?\s?(.*)/.exec(input);
    const duration = _.get(matched, 1, '');
    const bannedPhrase = _.get(matched, 2, '').toLowerCase();
    let parsedDuration = defaultPunishmentDuration;
    if (duration !== '') {
      parsedDuration = parseDurationToSeconds(duration);
      if (parsedDuration === null) {
        return new CommandOutput(null, 'Could not parse the duration. Usage: "!AddX {amount}{m,h,d,w} {some banned phrase} " !AddMute 1d YOU BEEN GNOMED');
      }
    }
    return services.sql.addBannedPhrase(bannedPhrase, parsedDuration, punishmentType)
      .then(() => {
        services.spamDetection.addBannedPhrase(
          { text: bannedPhrase, duration: parsedDuration, type: punishmentType },
        );
        return new CommandOutput(null, 'Phrase banned!');
      }).catch((err) => {
        if (err.errno === 19) {
          return new CommandOutput(null, 'Phrase already banned!');
        }
        return new Command(err, 'Oops. Something did not work. Check the logs.');
      });
  };
}

module.exports = {
  addban: new Command(banphrase(1800, 'ban'), true, true, /(\d+[hmds])?\s?(.*)/, false),
  addmute: new Command(banphrase(600, 'mute'), true, true, /(\d+[hmds])?\s?(.*)/, false),
};
