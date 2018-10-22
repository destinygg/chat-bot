const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function deleteScheduledCommand(input, services) {
  const matched = /(!\w+)/.exec(input);
  const commandKey = _.get(matched, 1, '').toLowerCase();
  if (commandKey === '') {
    return new CommandOutput(null, `Command '${commandKey}' not parsed. Must be in format !commandtodelete`);
  }
  if (services.commandRegistry.findCommand(commandKey) === false) {
    return Promise.resolve(new CommandOutput(null, 'Command was not scheduled, so nothing was removed.'));
  }
  return services.sql.deleteScheduledCommand(commandKey)
    .then(() => {
      services.scheduledCommands.removeScheduledCommand(commandKey);
      return new CommandOutput(null, `Command ${commandKey} removed from scheduling!`);
    }).catch((err) => {
      if (err.message === 'Command not found') {
        return new CommandOutput(err, `Command ${commandKey} was not scheduled, and nothing was removed`);
      }
      return new CommandOutput(err, "Oops. Something didn't work. Check the logs.");
    });
}

module.exports = new Command(deleteScheduledCommand, true, true, /(!\w+)/);
