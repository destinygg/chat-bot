const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const { makeUnmute } = require('../../chat-utils/punishment-helpers');

function aegis(input, services) {
  const usersToUnmute = services.punishmentCache.getLastNukeList();
  if (usersToUnmute.length === 0) {
    return new CommandOutput(null, null, 'Hmmm. Did not find a stored nuke.');
  }

  usersToUnmute.forEach((user) => {
    services.punishmentStream.write(makeUnmute(user, false));
  });

  return new CommandOutput(null, null, `Unmuting ${usersToUnmute.length} users AngelThump`);
}

module.exports = new Command(aegis, false, true, null);
