const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function getLogsForUser(input, services) {
  const matched = /(\w+) ?(\d+)?/.exec(input);
  const user = _.get(matched, 1, '');
  const count = Math.min(Number(_.get(matched, 2, '4')), 25);
  return services.overRustle.getMostRecentLogsForUsers(user, count)
    .then((logs) => {
      logs.unshift(`Last ${count} logs for: ${input}`);
      return new CommandOutput(null, logs);
    })
    .catch(err => new CommandOutput(err, 'Could not find user :C'));
}

module.exports = new Command(getLogsForUser, true, true, /\w+( \d+)?/, true);
