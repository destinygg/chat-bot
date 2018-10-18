const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const { makeUnmute } = require('../../chat-utils/punishment-helpers');

function unmute(input, services) {
  const matched = /(\w+)/.exec(input);
  const userToUnmute = _.get(matched, 1, '').toLowerCase();
  if (_.isEmpty(userToUnmute)) {
    return new CommandOutput(new Error('User was empty.'), `Something did not work. ${userToUnmute} not unmuted.`);
  }
  services.punishmentStream.write(makeUnmute(userToUnmute, `Unmuting ${userToUnmute}`));
  return new CommandOutput(null, null, null);
}

module.exports = new Command(unmute, false, false, /(\w+)/, null);
