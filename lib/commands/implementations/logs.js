
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function getLogsUrlForUser(input, services) {
  return new CommandOutput(null, null, services.overRustle.getLogsUrlForUser(input));
}

module.exports = new Command(getLogsUrlForUser, false, false, /\w+/);
