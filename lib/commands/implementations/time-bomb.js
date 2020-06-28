const _ = require('lodash');

const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const { makeBan } = require('../../chat-utils/punishment-helpers');
const basePunishmentHelper = require('../base-punishment-helper');
const parseDurationToSeconds = require('../../chat-utils/duration-parser');

function timeBomb(input, services, rawMessage) {
  timeBomb.expression = /((?:\d+[HMDSWwhmds])\s+|(?:perm)\s+)?((?:\d+[HMDSWwhmds])\s+)?\s?(\w+(?:\s*,\s*\w+)*)(?:\s(.*))?/;

  const matched = timeBomb.expression.exec(input);

  const banTime = _.get(matched, 1, '').toLowerCase();
  const bombDelay = _.get(matched, 2, '');
  const users = _.get(matched, 3, '');
  const reason = _.get(matched, 4, '');
  const rebuiltExpression = `${banTime} ${users} ${reason}`.trim();
  const parsedInput = basePunishmentHelper(rebuiltExpression, 'perm');
  
  if (parsedInput === false) {
    return new CommandOutput(
      null,
      'Failed to parse. Usage: "!timebomb {ban time}{m,h,d,w}OR{perm} {bomb delay}{s,m,h} {user} {reason}"',
    );
  }

  parsedInput.forEach(result => {
    const { isPermanent, userToPunish, parsedDuration, parsedReason } = result;

    const bomb = () => {
      services.punishmentStream.write(
          makeBan(
            userToPunish,
            parsedDuration,
            true,
            isPermanent,
            `${userToPunish} banned through bot by ${rawMessage.user}. ${parsedReason === null ? '' : ` Reason: ${parsedReason}`}`,
          ),
        );
    };
    services.timeBombRegistry.arm(
      bomb, 
      userToPunish,
      parseDurationToSeconds(bombDelay), 
    );
  });

  const prefix = parsedInput.length > 1? `${parsedInput.length} time bombs` : `Time bomb`;
  return new CommandOutput(
    null, 
    `${prefix} set to go off in ${bombDelay || services.timeBombRegistry.defaultBombDelay+'s'}. 
    ${users} watch out SWEATSTINY`,
  );
}

function defuse(input, services) {
  defuse.expression = /(\w+(?:\s*,\s*\w+)*)?/;

  const matched = defuse.expression.exec(input);
  const users = _.get(matched, 1, '')
    .split(',')
    .map(x => x.trim());
  
  const bombs = services.timeBombRegistry.bombs;

  if (!users || users[0] === 'null') {
    if (bombs.length === 0) {
      return new CommandOutput(null, "It doesn't seem any timed bombs are set.");
    }
    services.timeBombRegistry.defuseAll();

    const plural = bombs.length > 1? 's' : '';
    return new CommandOutput(null, `Defusing ${bombs.length} bomb${plural}. AngelThump`)
  }

  users.forEach(user => {
    services.timeBombRegistry.defuse(user);
  });

  return new CommandOutput(null, `Defusing bombs for ${users.join(', ')}. AngelThump`)
}

module.exports = {
  timeBomb: new Command(
    timeBomb,
    false,
    true,
    timeBomb.expression,
    null,
  ),
  defuse: new Command(
    defuse,
    false,
    true,
    defuse.expression,
    null,
  ),
}
