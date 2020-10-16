const Command = require('../command-interface');
const CommandOutput = require('../command-output');

/**
 * @param {string} input
 * @param {import("../../services/service-index")} services
 */
function listCommands(input, services) {
  return services.sql
    .listCommands()
    .then((commands) => new CommandOutput(null, commands.match(/.{1,240},/g)))
    .catch((err) => {
      if (err && err.message === 'No commands') {
        return new CommandOutput(null, ['No commands stored in DB!']);
      }
      return new CommandOutput(err, ["Oops. Something didn't work. Check the logs."]);
    });
}

/**
 * @param {string} input
 * @param {import("../../services/service-index")} services
 */
function listScheduledCommands(input, services) {
  return services.sql
    .getScheduledCommands()
    .then((commands) => {
      const formattedOutput = commands
        .map((command) => command.cmd_key)
        .join(',')
        .trim();
      return new CommandOutput(null, formattedOutput.match(/.{1,240},/g));
    })
    .catch((err) => {
      if (err && err.message === 'No commands') {
        return new CommandOutput(null, ['No scheduled commands stored in DB!']);
      }
      return new CommandOutput(err, ["Oops. Something didn't work. Check the logs."]);
    });
}

module.exports = {
  listCommands: new Command(listCommands, true, true, null, true),
  listScheduledCommands: new Command(listScheduledCommands, true, true, null, true),
};
