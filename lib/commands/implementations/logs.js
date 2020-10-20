const Command = require('../command-interface');
const CommandOutput = require('../command-output');

/**
 * @param {string} input
 * @param {import("../../services/service-index")} services
 */
function getLogsUrlForUser(input, services) {
  return new CommandOutput(null, services.overRustle.getLogsUrlForUser(input));
}

module.exports = new Command(getLogsUrlForUser, false, false, /^\w+$/);
