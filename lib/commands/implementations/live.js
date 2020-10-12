const moment = require('moment');
const formatDuration = require('../../chat-utils/format-duration');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

async function live(input, services) {
  try {
    const twitchStatus = await services.tempTwitchApi.getChannelStatus();
    const youtubeStatus = await services.youtube.getChannelStatus();
    let totalViewers = 0;
    let twitchViewers = 0;
    let youtubeViewers = 0;

    if (twitchStatus.isLive) {
      twitchViewers = parseInt(twitchStatus.viewers, 10);
    }
    if (youtubeStatus.isLive) {
      youtubeViewers = parseInt(youtubeStatus.viewers, 10);
    }

    if (twitchViewers) {
      totalViewers += twitchViewers;
    }
    if (youtubeViewers) {
      totalViewers += youtubeViewers;
    }
    const now = moment();
    const formattedDuration = formatDuration(moment.duration(now.diff(twitchStatus.started)));
    const output = `Viewers: ${totalViewers}, TTV: ${twitchViewers}, YT: ${youtubeViewers}. Stream live as of ${formattedDuration} ago`;

    return new CommandOutput(null, `${output}`);
  } catch (error) {
    return new CommandOutput(error, 'Twitch api is messed up go complain to them PepeLaugh ');
  }
}

module.exports = new Command(live, true, false, null);
