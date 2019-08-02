const _ = require('lodash');

const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const { makeBan } = require('../../chat-utils/punishment-helpers');
const basePunishmentHelper = require('../base-punishment-helper');

const cloggedGunPhrases = [
  'Oh jeez, my ban gun is clogged. Looks like this guy is spared.',
  'OwO~~ Dis chatter is too cute for me to ban, desu~ Ayaya Ayaya',
  'Heh, nice try kid. Maybe try again later.',
  'Oh? You think you can tell ME what to do?',
  '*gun clicks* Oh. Lucky.',
  'No matter how hard I try, I just cant do it. I love this chatter too much.',
  'Huhuhuhuhu, nice trrry moderator. But this chat is now owned by the People.',
  '*gun jams*',
  '*gun clicks*',
  'Whoops. Outta rounds, lemme reload.',
  'You must construct additional Pylons to ban this chatter.',
  'Additional Pylons are required to ban this chatter.',
  'MUST CONSTRUCT ADDITIONAL PYLONS',
  'PLEASE CONSTRUCT MORE PYLONS',
  'LUL You thought I would?!',
  'Ayaya Ayaya youve been spared by the Ayaya of good graces, Ayaya',
  'This random ban spare is brought to you by MrMouton.',
  'Youre lucky my blade is dull.',
  '*gun clicks*',
  'gun jams',
];


function isIpBan(ipBan, defaultBanTime) {
  return function ban(input, services, rawMessage) {
    const didFizzle = Math.floor(Math.random() * (20));
    if (didFizzle === 0) {
      return new CommandOutput(null, _.shuffle(cloggedGunPhrases)[0]);
    }
    const parsedInput = basePunishmentHelper(input, defaultBanTime);
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
  ipban: new Command(isIpBan(true, 'perm'), false, true, /((?:\d+[HMDSWwhmds])|(?:perm))?\s?(\w+)(?:\s(.*))?/, null),
  ban: new Command(isIpBan(false, 600), false, true, /((?:\d+[HMDSWwhmds])|(?:perm))?\s?(\w+)(?:\s(.*))?/, null),
};
