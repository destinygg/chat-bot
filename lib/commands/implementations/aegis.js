const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const { makeUnban } = require('../../chat-utils/punishment-helpers');

function aegis(input, services) {
  const usersToUnmute = services.punishmentCache.getNukedUsers();
  if (usersToUnmute.length === 0 && services.punishmentCache.getNukedPhrases().length === 0) {
    return new CommandOutput(null, 'Hmmm. Did not find a stored nuke.');
  }
  services.punishmentCache.cleaseNukes();

  usersToUnmute.forEach((user) => {
    services.punishmentStream.write(makeUnban(user, false));
  });

  return new CommandOutput(
    null,
    `Removing nuked phrases! Unmuting ${usersToUnmute.length} users AngelThump`,
  );
}

module.exports = new Command(aegis, false, true, null);
