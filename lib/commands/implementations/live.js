const moment = require('moment');
const formatDuration = require('../../chat-utils/format-duration');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

async function live(input, services) {
  try {
    const twitchStatus = await services.tempTwitchApi.getChannelStatus();
    const youtubeStatus = await services.youtube.getChannelStatus();
    const now = moment();
    let totalViewers = 0;
    let twitchViewers = 0;
    let youtubeViewers = 0;

    if (!twitchStatus.isLive && !youtubeStatus.isLive) {
      const formattedDuration = formatDuration(moment.duration(now.diff(twitchStatus.stopped)));

      return new CommandOutput(
        null,
        `Stream was last online ${formattedDuration} ago. Time Streamed: ${formatDuration(
          twitchStatus.duration,
        )}`,
      );
    }

    if (twitchStatus.isLive) {
      twitchViewers = parseInt(twitchStatus.viewers, 10);
      totalViewers += twitchViewers;
    }
    if (youtubeStatus.isLive) {
      youtubeViewers = parseInt(youtubeStatus.viewers, 10);
      totalViewers += youtubeViewers;
    }

    const formattedDuration = formatDuration(moment.duration(now.diff(twitchStatus.started)));
    if (twitchStatus.isLive && youtubeStatus.isLive) {
      return new CommandOutput(
        null,
        `Viewers: ${totalViewers}, TTV: ${twitchViewers}, YT: ${youtubeViewers}. Stream live as of ${formattedDuration} ago`,
      );
    }
    return new CommandOutput(
      null,
      `Viewers: ${totalViewers}. Stream live as of ${formattedDuration} ago`,
    );
  } catch (error) {
    return new CommandOutput(
      error,
      `Twitch or Youtube api is messed up go complain to them PepeLaugh ${error}`,
    );
  }
}

module.exports = new Command(live, true, false, null);
