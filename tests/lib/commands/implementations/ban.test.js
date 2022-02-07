const CommandOutput = require('../../../../lib/commands/command-output');
const assert = require('assert');
const sinon = require('sinon');
const Command = require('../../../../lib/commands/command-interface');
const config = require('../../../../lib/configuration/prod.config.json');
const MessageRelay = require('../../../../lib/services/message-relay');
const PunishmentCache = require('../../../../lib/services/punishment-cache');
const RoleCache = require('../../../../lib/services/role-cache');
const messageMatching = require('../../../../lib/services/message-matching');
const { ban } = require('../../../../lib/commands/implementations/ban')

// These should be moved to a seperate file that the actual code sources from
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

describe('Flair based dodge test', () => {
  beforeEach(() => {
    config['flairBasedBanDodgeChances']['testFlair'] = 1;
    roleCache = new RoleCache(config);
    roleCache.roleMap = {
      kierke: { roles: ['testFlair'], timestamp: 123 },
      poorkierke: { roles: [], timestamp: 123 },
    };

    this.mockServices = {
      messageRelay: new MessageRelay(),
      messageMatching,
      punishmentStream: {
        write: sinon.spy(),
      },
      punishmentCache: new PunishmentCache(config),
      roleCache: roleCache,
    };

    this.possbileOutputs = cloggedGunPhrases.concat(flairArmorPhrases);
  });

  it('dodges !ban sometimes', () => {
    let output1 = ban.work('kierke 10m No reason', this.mockServices, {user: 'kierke'}).output;
    let output2 = ban.work('poorkierke 10m No reason', this.mockServices, {user: 'poorkierke'}).output;
    assert(this.possbileOutputs.includes(output1));
    assert(!this.possbileOutputs.includes(output2));
  });
});
