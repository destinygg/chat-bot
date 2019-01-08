const _ = require('lodash');

const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const { makeUnmute } = require('../../chat-utils/punishment-helpers');

function aegis(input, services) {
  const usersToUnmute = _.flatten(services.punishmentCache.getLastNukeList());
  if (usersToUnmute.length === 0 && services.punishmentCache.getNukedPhrases().length === 0) {
    return new CommandOutput(null, 'Hmmm. Did not find a stored nuke.');
  }
  services.punishmentCache.cleaseNukes();

  usersToUnmute.forEach((user) => {
    services.punishmentStream.write(makeUnmute(user, false));
  });

  return new CommandOutput(null, `Removing nuked phrases! Unmuting ${usersToUnmute.length} users AngelThump`);
}

module.exports = new Command(aegis, false, true, null);
