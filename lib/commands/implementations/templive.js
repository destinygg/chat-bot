const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function tempLive(input, services) {
  return services.tempTwitchApi.getChannelStatus()
    .then(channelData => new CommandOutput(null, `${channelData}`))
    .catch(err => new CommandOutput(err, "Oops. Something didn't work. Check the logs."));
}

module.exports = new Command(tempLive, true, false, null);
