const CommandOutput = require('../command-output');

/**
 * @param {string} staticOutput
 */
function staticCommand(staticOutput) {
  return () => new CommandOutput(null, staticOutput);
}

module.exports = staticCommand;
