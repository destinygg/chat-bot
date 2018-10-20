const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function deleteCommand(input, services) {
  const matched = /(!\w+)/.exec(input);
  const commandToDelete = _.get(matched, 1).toLowerCase();
  if (!services.commandRegistry.findCommand(commandToDelete)) {
    return Promise.resolve(new CommandOutput(null, null, `${commandToDelete} not found. Did nothing.`));
  }
  return services.sql.deleteCommand(commandToDelete)
    .then(() => {
      this.services.commandRegistry.removeCommand(commandToDelete);
      return new CommandOutput(null, null, `Added new command: ${commandToDelete}`);
    })
    .catch((err) => {
      if (err.message === 'Command does not exist') {
        return new CommandOutput(err, `${commandToDelete} does not exist. Try !listcommands`);
      }
      return new CommandOutput(err, "Oops. Something didn't work. Check the logs.", null);
    });
}

module.exports = new Command(deleteCommand, true, true, /(!\w+)/);
