const { version } = require('../../../package.json');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function getVersion() {
  return new CommandOutput(null, `Running v${version}`);
}

module.exports = new Command(getVersion, false, false, null);
