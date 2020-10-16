const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

/**
 * @param {string} input
 * @param {import("../../services/service-index")} services
 */
function love(input, services, raw) {
  const emoji = [
    '(*˘︶˘*).｡.:*♡',
    '(✿ ♥‿♥)',
    '໒(♥ ◡ ♥)७',
    '(●♡∀♡))ヾ☆*。',
    '(●´□`)♡',
    '( •ॢ◡-ॢ)-♡',
    '(人´ω｀*)♡',
    '（。ˇ ⊖ˇ）♡',
  ];
  return new CommandOutput(null, `${_.shuffle(emoji)[0]} ${raw.user} 💕💕`);
}

module.exports = new Command(love, false, false, null, null);
