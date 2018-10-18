const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const parseDurationToSeconds = require('../../chat-utils/duration-parser');
const { makeBan } = require('../../chat-utils/punishment-helpers');

function isIpBan(ipBan) {
  return function ban(input, services, rawMessage) {
    const matched = /(\w+)\s?(\d+[hmds])?/.exec(input);
    const userToBan = _.get(matched, 1, '').toLowerCase();
    let duration = _.get(matched, 2, '').toLowerCase();

    switch (duration) {
      case '':
        duration = 0;
        break;
      default:
        duration = parseDurationToSeconds(duration);
        if (duration === null) {
          return new CommandOutput(null, null, 'Could not parse the duration. Usage: "!ban {user} {amount}{m,h,d,w}" !ban Destiny 1d');
        }
        break;
    }

    services.punishmentStream.write(makeBan(userToBan, duration, ipBan, false, `${userToBan} banned through bot by ${rawMessage.user}`));
    return new CommandOutput(null, null, null);
  };
}

module.exports = {
  ipban: new Command(isIpBan(true), false, true, /(\w+)\s?(\d+[hmds])?/, null),
  ban: new Command(isIpBan(false), false, true, /(\w+)\s?(\d+[hmds])?/, null),
};
