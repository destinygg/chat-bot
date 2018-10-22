const CommandOutput = require('../command-output');

function staticCommand(staticOutput) {
  return () => new CommandOutput(null, staticOutput);
}

module.exports = staticCommand;
