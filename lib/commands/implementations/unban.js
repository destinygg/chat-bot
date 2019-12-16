const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const { makeUnban, makeUnmute } = require('../../chat-utils/punishment-helpers');

function unbanOrUnmute(isUnban) {
  return (input, services) => {
    const matched = /(\w+(?:\s*,\s*\w+)*)/.exec(input);
    const usersToUnban = _.get(matched, 1, '')
      .toLowerCase()
      .split(',')
      .map(x => x.trim());

    if (_.isEmpty(usersToUnban)) {
      return new CommandOutput(
        new Error('User was empty.'),
        `Something did not work. ${usersToUnban} not unbanned.`,
      );
    }

    usersToUnban.forEach(userToUnpunish => {
      const unPunish = isUnban ? makeUnban(userToUnpunish) : makeUnmute(userToUnpunish);
      services.punishmentStream.write(unPunish);
    });

    return new CommandOutput(null, null);
  };
}

module.exports = {
  unBan: new Command(unbanOrUnmute(true), false, true, /(\w+)/, null),
  unMute: new Command(unbanOrUnmute(false), false, true, /(\w+)/, null),
};
