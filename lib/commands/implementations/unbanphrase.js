const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function banphrase(chatConnectedTo) {
  return (input, services) => {
    if (chatConnectedTo === 'dgg') {
      const bannedPhrase = input;
      services.bannedPhrases.removeBannedPhrase(bannedPhrase);
      return new CommandOutput(null, 'Phrase unbanned! AngelThump');
    }
    const matched = /(.*)/.exec(input);
    const phraseToUnban = _.get(matched, 1, '').toLowerCase();
    if (services.spamDetection.hasBannedPhrase(phraseToUnban) === false) {
      return Promise.resolve(new CommandOutput(null, 'Phrase is not registered! Did nothing.'));
    }
    return services.sql
      .deleteBannedPhrase(phraseToUnban)
      .then(() => {
        services.spamDetection.removeBannedPhrase(phraseToUnban);
        return new CommandOutput(null, 'Phrase unbanned! AngelThump');
      })
      .catch((err) => new CommandOutput(err, 'Oops. Something did not work. Check the logs.'));
  }
}

module.exports = {
  unbanphrase: new Command(banphrase('twitch'), true, true, /(.*)/, false),
  removephrase: new Command(banphrase('dgg'), false, true),
}
