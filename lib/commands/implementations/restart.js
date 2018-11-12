
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function restart() {
  // So, we're running as a service in prod. So this is a restart
  // that will crash the bot, causing the service to restart.
  setTimeout(() => {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }, 2000);
  return new CommandOutput(null, 'Restarting...');
}

module.exports = new Command(restart, false, true, null);
