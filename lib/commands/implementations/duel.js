const moment = require('moment');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const { makeMute } = require('../../chat-utils/punishment-helpers');
const parseDurationToSeconds = require('../../chat-utils/duration-parser');
const formatDuration = require('../../chat-utils/format-duration');

const WORD_LIST = [
  'apple', 'beach', 'brick', 'chair', 'cloud', 'dance', 'dream', 'eagle',
  'flame', 'glass', 'grape', 'house', 'juice', 'kneel', 'lemon', 'light',
  'maple', 'night', 'ocean', 'paint', 'pearl', 'plant', 'queen', 'river',
  'shade', 'sheep', 'slate', 'smile', 'snake', 'solar', 'spike', 'stage',
  'steam', 'stone', 'storm', 'sugar', 'table', 'tiger', 'toast', 'tower',
  'train', 'tulip', 'umbra', 'vigor', 'voice', 'water', 'whale', 'wheel',
  'world', 'yield', 'bread', 'brush', 'candy', 'chain', 'chess', 'cliff',
  'coral', 'crane', 'crown', 'delta', 'drift', 'ember', 'field', 'frost',
  'globe', 'grain', 'haven', 'ivory', 'jewel', 'karma', 'lance', 'marsh',
  'noble', 'orbit', 'patch', 'pixel', 'prism', 'quest', 'reign', 'ridge',
];

const HOMOGLYPHS = {
  a: '\u0430', // Cyrillic а
  c: '\u0441', // Cyrillic с
  e: '\u0435', // Cyrillic е
  o: '\u043E', // Cyrillic о
  p: '\u0440', // Cyrillic р
  s: '\u0455', // Cyrillic ѕ
  i: '\u0456', // Cyrillic і
};

function generatePhrase() {
  const words = [];
  for (let i = 0; i < 5; i += 1) {
    words.push(WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]);
  }
  return words.join(' ');
}

function injectHomoglyph(phrase) {
  const candidates = [];
  for (let i = 0; i < phrase.length; i += 1) {
    if (HOMOGLYPHS[phrase[i]]) {
      candidates.push(i);
    }
  }
  if (candidates.length === 0) return phrase;
  const idx = candidates[Math.floor(Math.random() * candidates.length)];
  return phrase.slice(0, idx) + HOMOGLYPHS[phrase[idx]] + phrase.slice(idx + 1);
}

function duel(defaultMuteDuration) {
  let duelActive = false;
  let failSafeTimeout = null;
  return (input, services) => {
    if (duelActive) {
      return new CommandOutput(
        null,
        'A duel is already in progress. Please wait for it to finish.',
      );
    }

    const matched = /^(?:(\d+[HMDSWwhmds])\s+)?(\w+)\s+(\w+)$/.exec(input.trim());
    if (!matched) {
      return new CommandOutput(null, 'Usage: !duel [duration] user1 user2');
    }

    const durationStr = matched[1];
    const user1 = matched[2];
    const user2 = matched[3];

    if (user1.toLowerCase() === user2.toLowerCase()) {
      return new CommandOutput(null, "You can't duel someone against themselves.");
    }

    let muteDuration = defaultMuteDuration;
    if (durationStr) {
      const parsed = parseDurationToSeconds(durationStr);
      if (parsed) {
        muteDuration = parsed;
      }
    }

    const muteString = formatDuration(moment.duration(muteDuration, 'seconds'));

    duelActive = true;

    setTimeout(() => {
      const phrase = generatePhrase();
      const displayPhrase = injectHomoglyph(phrase);

      const listener = services.messageRelay.startListenerForChatMessages('duel');
      if (listener === false) {
        duelActive = false;
        services.messageRelay.sendOutputMessage(
          'Something went wrong starting the duel. Try again.',
        );
        return;
      }

      failSafeTimeout = setTimeout(() => {
        duelActive = false;
        services.messageRelay.stopRelay('duel');
        services.messageRelay.sendOutputMessage(
          `DUEL between ${user1} and ${user2} has timed out. No one gets muted.`,
        );
      }, 30000);

      listener.on('msg', (data) => {
        const sender = data.user.toLowerCase();
        if (sender !== user1.toLowerCase() && sender !== user2.toLowerCase()) {
          return;
        }

        if (data.message.trim().toLowerCase() !== phrase.toLowerCase()) {
          return;
        }

        clearTimeout(failSafeTimeout);
        duelActive = false;
        services.messageRelay.stopRelay('duel');

        const winner = data.user;
        const loser = sender === user1.toLowerCase() ? user2 : user1;

        services.messageRelay.sendOutputMessage(
          `${winner} wins the duel! ${loser} gets muted for ${muteString}.`,
        );
        services.punishmentStream.write(makeMute(loser, muteDuration));
      });

      services.messageRelay.sendOutputMessage(
        `DUEL! ${user1} vs ${user2} -- First to type "${displayPhrase}" wins. Loser gets muted for ${muteString}. You have 30 seconds. GO!`,
      );
    }, 10000);

    return new CommandOutput(
      null,
      `DUEL! ${user1} vs ${user2} -- Get ready! The phrase to type will appear in 10 seconds. Loser gets muted for ${muteString}.`,
    );
  };
}

module.exports = {
  duel: new Command(duel(600), false, true, /(?:\d+[HMDSWwhmds]\s+)?\w+\s+\w+/, null),
};
