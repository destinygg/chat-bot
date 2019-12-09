const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function addScheduledCommand(input, services) {
  const matched = /(!\w+)/.exec(input);
  const commandKey = _.get(matched, 1, '').toLowerCase();
  if (commandKey === '') {
    return new CommandOutput(
      null,
      `Command '${commandKey}' to schedule was not parsed. Must be in the format !CommandToSchedule`,
    );
  }
  if (services.commandRegistry.findCommand(commandKey) === false) {
    return Promise.resolve(
      new CommandOutput(
        null,
        `Command '${commandKey}' not scheduled. Command must be registered first with !addcommand`,
      ),
    );
  }
  return services.sql
    .addScheduledCommand(commandKey)
    .then(() => {
      const commandObject = services.commandRegistry.findCommand(commandKey);
      services.scheduledCommands.addScheduledCommand(commandKey, commandObject);
      return new CommandOutput(null, `Command ${commandKey} scheduled!`);
    })
    .catch(err => {
      if (err.message === 'Command not found or already scheduled') {
        return new CommandOutput(null, 'Command not found or already scheduled');
      }
      return new CommandOutput(err, "Oops. Something didn't work. Check the logs.");
    });
}

module.exports = new Command(addScheduledCommand, true, true, /(!\w+)/);
