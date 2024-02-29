const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function unbanPhraseTwitch() {
  return (input, services) => {
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
  };
}

function unbanPhraseDGG() {
  return (input, services) => {
    const bannedPhrase = input;
    services.bannedPhrases.removeBannedPhrase(bannedPhrase);
    return new CommandOutput(null, 'Phrase unbanned! AngelThump');
  };
}

module.exports = {
  unbanphraseTwitch: new Command(unbanPhraseTwitch(), true, true, /(.*)/, false),
  unbanphraseDGG: new Command(unbanPhraseDGG(), false, true),
};
