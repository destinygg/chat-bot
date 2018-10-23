const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function getLogsForUser(input, services) {
  return services.overRustle.getMostRecentLogsForUsers(input)
    .then((logs) => {
      logs.unshift(`Last 4 logs for: ${input}`);
      return new CommandOutput(null, logs);
    })
    .catch(err => new CommandOutput(err, 'Could not find user :C'));
}

module.exports = new Command(getLogsForUser, true, true, /\w+/, true);
