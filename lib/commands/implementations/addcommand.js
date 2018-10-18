const _ = require('lodash');
const staticOutput = require('./static-output');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function addCommand(input, services) {
  const matched = /(!\w+)\s(.*)/.exec(input);
  const newCommand = _.get(matched, 1).toLowerCase();
  const commandText = _.get(matched, 2);
  if (services.commandRegistry.findCommand(newCommand)) {
    return Promise.resolve(new CommandOutput(null, null, `Command '${newCommand}' already exists.`));
  }
  return services.sql.addCommand(newCommand, commandText)
    .then(() => {
      services.commandRegistry.registerCommand(newCommand,
        new Command(staticOutput(commandText), false, null, null));
      return new CommandOutput(null, null, `Added new command: ${newCommand}`);
    }).catch(err => new CommandOutput(err, "Oops. Something didn't work. Check the logs."));
}

module.exports = new Command(addCommand, true, true, /(!\w+)\s(.*)/);
