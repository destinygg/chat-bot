const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const { makeUnban } = require('../../chat-utils/punishment-helpers');

function unban(input, services) {
  const matched = /(\w+)/.exec(input);
  const userToUnban = _.get(matched, 1, '').toLowerCase();
  if (_.isEmpty(userToUnban)) {
    return new CommandOutput(new Error('User was empty.'), `Something did not work. ${userToUnban} not unbanned.`);
  }
  services.punishmentStream.write(makeUnban(userToUnban));
  return new CommandOutput(null, null, null);
}

module.exports = new Command(unban, false, true, /(\w+)/, null);
