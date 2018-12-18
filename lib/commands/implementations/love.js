const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function love(input, services, raw) {
  const emoji = ['(*˘︶˘*).｡.:*♡', '(✿ ♥‿♥)', '໒(♥ ◡ ♥)७', '(●♡∀♡))ヾ☆*。', '(●´□`)♡', '( •ॢ◡-ॢ)-♡', '(人´ω｀*)♡', '（。ˇ ⊖ˇ）♡'];
  if(raw.user === 'JAYL') {
    const matched = /(\w{1,30})/.exec(input);
    const userToLove = _.get(matched, 1, '');
    return new CommandOutput(null, `${_.shuffle(emoji)[0]}${userToLove === 'null' ? raw.user : userToLove}💕💕`);
  } else {
    return new CommandOutput(null, `${_.shuffle(emoji)[0]} ${raw.user} 💕💕`);
  }
}

module.exports = new Command(love, false, false, null, null);
