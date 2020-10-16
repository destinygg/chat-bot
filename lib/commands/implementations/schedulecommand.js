const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

/**
 * @param {string} input
 * @param {import("../../services/service-index")} services
 */
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
      if (commandObject === false) {
        services.logger.error(
          `Could not find command '${commandKey} when trying to add it to schedule'`,
        );
        throw new Error(`Command not found`);
      }
      services.scheduledCommands.addScheduledCommand(commandKey, commandObject);
      return new CommandOutput(null, `Command ${commandKey} scheduled!`);
    })
    .catch((err) => {
      if (err.message === 'Command not found or already scheduled') {
        return new CommandOutput(null, 'Command not found or already scheduled');
      }
      if (err.message === 'Command not found') {
        return new CommandOutput(null, 'Command not found');
      }
      return new CommandOutput(err, "Oops. Something didn't work. Check the logs.");
    });
}

module.exports = new Command(addScheduledCommand, true, true, /(!\w+)/);
