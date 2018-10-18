const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function listCommands(input, services) {
  return services.sql.listCommands()
    .then(commands => new CommandOutput(null, null, `Commands stored in DB: ${commands}`))
    .catch(err => new CommandOutput(err, "Oops. Something didn't work. Check the logs.", null));
}

module.exports = new Command(listCommands, true, false, null);
