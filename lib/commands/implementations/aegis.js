const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const { makeUnban } = require('../../chat-utils/punishment-helpers');

function aegis(input, services) {
  const usersToUnmute = services.moderationState.getNukedUsers();
  if (usersToUnmute.length === 0 && services.moderationState.getNukes().length === 0) {
    return new CommandOutput(null, 'Hmmm. Did not find a stored nuke.');
  }
  services.moderationState.clearNukes();

  usersToUnmute.forEach((user) => {
    services.punishmentStream.write(makeUnban(user.nick, false));
  });

  return new CommandOutput(
    null,
    `Removing nuked phrases! Unmuting ${usersToUnmute.length} users AngelThump`,
  );
}

function aegisSingle(input, services) {
  const matched = /(?:\/(.*)\/)?(.*)/.exec(input);
  const aegisWord = _.get(matched, 2, '').toLowerCase();
  const aegisRegex = _.get(matched, 1, '');
  const isRegex = aegisRegex !== '';
  if (!isRegex && aegisWord === '') {
    return new CommandOutput(null, 'Removed phrase (unless it didnt exist, then I did nothing');
  }

  const wordToUnnuke = isRegex
    ? new RegExp(aegisRegex, 'i').toString()
    : new RegExp(`\\b${aegisWord}\\b`, 'i').toString();
  const nukeFilter = isRegex
    ? { phrase: aegisRegex, regex: true }
    : { phrase: aegisWord, regex: false };
  const usersToUnmute = services.moderationState.getNukedUsers(nukeFilter);
  services.moderationState.removeNuke({ ...nukeFilter, clearVictims: true });
  if (usersToUnmute.length === 0) {
    return new CommandOutput(null, 'Removed phrase (unless it didnt exist, then I did nothing');
  }

  usersToUnmute.forEach((user) => {
    services.punishmentStream.write(makeUnban(user.nick, false));
  });

  return new CommandOutput(
    null,
    `Removing nuked phrase "${wordToUnnuke}"! Unmuting ${usersToUnmute.length} users AngelThump`,
  );
}

function getNukedPhrase(input, services) {
  const nukedPhrases = services.moderationState
    .getNukes()
    .map((nuke) => (nuke.regex ? `/${nuke.phrase}/` : nuke.phrase))
    .join(', ');
  return new CommandOutput(null, `List of nuked phrases: ${nukedPhrases}`);
}

module.exports = {
  aegis: new Command(aegis, false, true, null),
  aegisSingle: new Command(aegisSingle, false, true, null),
  getNukes: new Command(getNukedPhrase, false, true, null),
};
