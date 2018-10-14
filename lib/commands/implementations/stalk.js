
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function getLogsForUser(input, services) {
  return services.overRustle.getMostRecentLogsForUsers(input)
    .then(logs => new CommandOutput(null, null, logs))
    .catch(err => new CommandOutput(err, 'Could not find user :C', null));
}

module.exports = new Command(getLogsForUser, true, { allowList: ['linusred'] }, /\w+/);
