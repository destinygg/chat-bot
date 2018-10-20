const CommandOutput = require('../command-output');

function staticCommand(staticOutput) {
  return () => new CommandOutput(null, null, staticOutput);
}

module.exports = staticCommand;
