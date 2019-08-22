const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function tempLive(input, services) {
  return services.tempTwitchApi.getChannelStatus()
    .then(channelData => new CommandOutput(null, `${channelData}`))
    .catch(err => new CommandOutput(err, "Twitch api is messed up go complain to them PepeLaugh "));
}

module.exports = new Command(tempLive, true, false, null);
