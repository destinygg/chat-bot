const _ = require('lodash');

const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const { makeBan } = require('../../chat-utils/punishment-helpers');
const basePunishmentHelper = require('../base-punishment-helper');

const cloggedGunPhrases = [
  'Oh jeez, my ban gun is clogged. Looks like this guy is spared.',
  'OwO~~ Dis chatter is too cute for me to ban, desu~ AYAYA AYAYA',
  'Heh, nice try kid. Maybe try again later.',
  'Oh? You think you can tell ME what to do?',
  '*gun clicks* Oh. Lucky.',
  'No matter how hard I try, I just cant do it. I love this chatter too much.',
  'Huhuhuhuhu, nice trrry moderator. But this chat is now owned by the People.',
  '*gun jams*',
  '*gun clicks*',
  'Not today, too busy. Maybe later.',
  'Whoops. Outta rounds, lemme reload.',
  'You must construct additional Pylons to ban this chatter.',
  'Additional Pylons are required to ban this chatter.',
  'MUST CONSTRUCT ADDITIONAL PYLONS',
  'PLEASE CONSTRUCT MORE PYLONS',
  'LUL You thought I would?!',
  'AYAYA AYAYA youve been spared by the AYAYA of good graces, AYAYA',
  'This random ban spare is brought to you by MrMouton.',
  "You're lucky my blade is dull.",
  '*gun clicks*',
  'gun jams',
];

const flairArmorPhrases = [
  '*PING* Your flair armor deflects the ban... this time.',
  'You are too important to ban, what was he thinking?',
  'Your AC is too high. The ban does not hit.',
  'Chat quick, wide to hide! Your flair stopped the ban widepeepoHappy'
];

function isIpBan(ipBan, defaultBanTime) {
  return function ban(input, services, rawMessage) {
    const didFizzle = Math.floor(Math.random() * 50);
    if (didFizzle === 0) {
      return new CommandOutput(null, _.shuffle(cloggedGunPhrases)[0]);
    }
    const parsedInput = basePunishmentHelper(input, defaultBanTime);
    if (parsedInput === false) {
      return new CommandOutput(
        null,
        'Could not parse the duration. Usage: "!ban {amount}{m,h,d,w}OR{perm} {user} {reason}" !mute 1d Destiny he was streaming',
      );
    }
    dodged = false;
    parsedInput.forEach((result) => {
      const { isPermanent, userToPunish, parsedDuration, parsedReason } = result;
      const roles = services.roleCache.getUsersRoles(userToPunish);
      const flairArmorMap = services.punishmentCache.flairArmorMap;
      let dodgeChances = [];
      dodgeChances = _.map(roles, (role) => {
        if (role in flairArmorMap) {
          return flairArmorMap[role];
        } else {
          return 0;
        }
      });
      // Currently flair with max dodge chance (no multi-flair bonus)
      if (Math.random() < Math.max(...dodgeChances)) {
        dodged = true;
      } else if (!dodged) {
        services.punishmentStream.write(
          makeBan(
            userToPunish,
            parsedDuration,
            ipBan,
            isPermanent,
            `${userToPunish} banned through bot by ${rawMessage.user}.
      ${parsedReason === null ? '' : ` Reason: ${parsedReason}`}`,
          ),
        );
      }
    });
    if(dodged) {
      return new CommandOutput(null, _.shuffle(flairArmorPhrases)[0]);
    }
    return new CommandOutput(null, null);
  };
}

module.exports = {
  ipban: new Command(
    isIpBan(true, 'perm'),
    false,
    true,
    /((?:\d+[HMDSWwhmds])|(?:perm))?\s?(\w+)(?:\s(.*))?/,
    null,
  ),
  ban: new Command(
    isIpBan(false, 600),
    false,
    true,
    /((?:\d+[HMDSWwhmds])|(?:perm))?\s?(\w+)(?:\s(.*))?/,
    null,
  ),
};
