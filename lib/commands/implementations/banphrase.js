const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function banPhraseDGG() {
  return () => {
    return new CommandOutput(null, 'This command has been removed, use native /addban instead.');
  };
}

module.exports = new Command(banPhraseDGG(), false, true, /(\d+[HMDSWwhmds])?\s?(.*)/, false);
