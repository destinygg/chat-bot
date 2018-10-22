const moment = require('moment');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

async function getLiveStatus(input, services) {
  let isLive;
  let lastStartTime;
  let channelName;

  try {
    ({ isLive, lastStartTime } = await services.twitch.getStreamStatus());
    channelName = await services.twitch.getChannelDisplayName();
  } catch (err) {
    return new CommandOutput(err, "Oops. Something didn't work. Check the logs.");
  }
  const startedAgo = moment.duration(moment(lastStartTime).diff(moment()));
  if (isLive) {
    return new CommandOutput(null, `${channelName} went live ${startedAgo.humanize(true)}`);
  }
  return new CommandOutput(null, `${channelName} went offline ${startedAgo.humanize(true)}`);
}

module.exports = new Command(getLiveStatus, true, false, /\w+/);
