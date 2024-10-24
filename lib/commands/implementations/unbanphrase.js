const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function unbanPhraseDGG() {
  return () => {
    return new CommandOutput(null, 'This command has been removed, use native /removeban instead.');
  };
}

module.exports = new Command(unbanPhraseDGG(), false, true);
