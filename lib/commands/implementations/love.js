const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function love(input, services, raw) {
  const matched = /(\w{1,30})/.exec(input);
  const userToLove = _.get(matched, 1, '');
  const emoji = ['(*˘︶˘*).｡.:*♡', '(✿ ♥‿♥)', '໒(♥ ◡ ♥)७', '(●♡∀♡))ヾ☆*。', '(●´□`)♡', '( •ॢ◡-ॢ)-♡', '(人´ω｀*)♡', '（。ˇ ⊖ˇ）♡'];
  return new CommandOutput(null, `${_.shuffle(emoji)[0]}${userToLove === 'null' ? raw.user : userToLove}💕💕`);
}

module.exports = new Command(love, false, false, null, null);
