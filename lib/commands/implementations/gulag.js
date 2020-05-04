const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const { makeMute } = require('../../chat-utils/punishment-helpers');
const basePunishmentHelper = require('../base-punishment-helper');

function gulag(input, services) {
  const parsedInput = basePunishmentHelper(input, services.gulagRunner.gulagMuteDuration);
  parsedInput.forEach(result => {
    const { userToPunish, parsedDuration } = result;
    services.punishmentStream.write(
      makeMute(userToPunish, parsedDuration, `${userToPunish} has been consigned to the gulag`),
      true,
    );
    services.gulagRunner.addUserToGulag(userToPunish);
  });
  return new CommandOutput(null, null);
}

function revolution(input, services) {
  services.gulagRunner.emptyGulag();
  return new CommandOutput(null, 'The gulag has been emptied');
}

module.exports = {
  gulag: new Command(gulag, false, true, /\w+( \d+)?/, null),
  revolution: new Command(revolution, false, true, /(.*)/, null),
};
