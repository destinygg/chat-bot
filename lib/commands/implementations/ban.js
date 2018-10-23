const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const { makeBan } = require('../../chat-utils/punishment-helpers');
const basePunishmentHelper = require('../base-punishment-helper');

function isIpBan(ipBan) {
  return function ban(input, services, rawMessage) {
    const parsedInput = basePunishmentHelper(input, 600);
    if (parsedInput === false) {
      return new CommandOutput(null, 'Could not parse the duration. Usage: "!mute {amount}{m,h,d,w} {user} " !mute 1d Destiny');
    }
    const { userToPunish, parsedDuration } = parsedInput;

    services.punishmentStream.write(makeBan(userToPunish, parsedDuration, ipBan, false, `${userToPunish} banned through bot by ${rawMessage.user}`));
    return new CommandOutput(null, null);
  };
}

module.exports = {
  ipban: new Command(isIpBan(true), false, true, /(\w+)\s?(\d+[hmds])?/, null),
  ban: new Command(isIpBan(false), false, true, /(\w+)\s?(\d+[hmds])?/, null),
};
