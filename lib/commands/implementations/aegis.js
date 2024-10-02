const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const { makeUnban } = require('../../chat-utils/punishment-helpers');

function aegis(input, services) {
  const usersToUnmute = services.punishmentCache.getNukedUsers();
  if (usersToUnmute.length === 0 && services.punishmentCache.getNukedPhrases().length === 0) {
    return new CommandOutput(null, 'Hmmm. Did not find a stored nuke.');
  }
  services.punishmentCache.cleanseNukes();

  usersToUnmute.forEach((user) => {
    services.punishmentStream.write(makeUnban(user, false));
  });

  return new CommandOutput(
    null,
    `Removing nuked phrases! Unmuting ${usersToUnmute.length} users AngelThump`,
  );
}

function aegisSingle(input, services) {
  const matched = /(?:\/(.*)\/)?(.*)/.exec(input);
  const aegisWord = _.get(matched, 2).toLowerCase();
  const aegisRegex = _.get(matched, 1, '');
  const wordToUnnuke =
    aegisRegex === ''
      ? new RegExp(`\\b${aegisWord}\\b`, 'i').toString()
      : new RegExp(aegisRegex, 'i').toString();
  const usersToUnmute = services.punishmentCache.getNukedUsersForPhrase(wordToUnnuke);
  services.punishmentCache.cleanseSingleNuke(wordToUnnuke);
  if (usersToUnmute.length === 0) {
    return new CommandOutput(null, 'Removed phrase (unless it didnt exist, then I did nothing');
  }
  services.punishmentCache.cleanseSingleNuke(wordToUnnuke);

  usersToUnmute.forEach((user) => {
    services.punishmentStream.write(makeUnban(user, false));
  });

  return new CommandOutput(
    null,
    `Removing nuked phrase "${wordToUnnuke}"! Unmuting ${usersToUnmute.length} users AngelThump`,
  );
}

function getNukedPhrase(input, services) {
  const nukedPhrases = services.punishmentCache
    .getNukedPhrases()
    .map((nuke) => nuke.phrase)
    .join(', ');
  return new CommandOutput(null, `List of nuked phrases: ${nukedPhrases}`);
}

module.exports = {
  aegis: new Command(aegis, false, true, null),
  aegisSingle: new Command(aegisSingle, false, true, null),
  getNukes: new Command(getNukedPhrase, false, true, null),
};
