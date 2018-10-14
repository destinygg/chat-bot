const CommandOutput = require('../command-output');

function staticCommand(staticOutput) {
  return () => new CommandOutput(null, false, staticOutput, null);
}

module.exports = staticCommand;
