const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const { makeBan } = require('../../chat-utils/punishment-helpers');
const basePunishmentHelper = require('../base-punishment-helper');

function isIpBan(ipBan) {
  return function ban(input, services, rawMessage) {
    const parsedInput = basePunishmentHelper(input, 600);
    if (parsedInput === false) {
      return new CommandOutput(null, 'Could not parse the duration. Usage: "!ban {amount}{m,h,d,w}OR{perm} {user} {reason}" !mute 1d Destiny he was streaming');
    }
    const {
      isPermanent, userToPunish, parsedDuration, parsedReason,
    } = parsedInput;

    services.punishmentStream.write(makeBan(userToPunish, parsedDuration, ipBan, isPermanent, `${userToPunish} banned through bot by ${rawMessage.user}. 
    ${parsedReason === null ? '' : ` Reason: ${parsedReason}`}`));
    return new CommandOutput(null, null);
  };
}

module.exports = {
  ipban: new Command(isIpBan(true), false, true, /((?:\d+[hmds])|(?:perm))?\s?(\w+)(?:\s(.*))?/, null),
  ban: new Command(isIpBan(false), false, true, /((?:\d+[hmds])|(?:perm))?\s?(\w+)(?:\s(.*))?/, null),
};
