const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function listCommands(input, services) {
  return services.sql.listCommands()
    .then(commands => new CommandOutput(null, `Commands stored in DB: ${commands}`))
    .catch((err) => {
      if (err && err.message === 'No commands') {
        return new CommandOutput(null, 'No commands stored in DB!');
      }
      return new CommandOutput(err, "Oops. Something didn't work. Check the logs.");
    });
}

module.exports = new Command(listCommands, true, false, null);
