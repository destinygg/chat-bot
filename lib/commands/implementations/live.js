const moment = require('moment');
const formatDuration = require('../../chat-utils/format-duration');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function live(input, services) {
  const twitchStatusPromise = services.tempTwitchApi.getChannelStatus();
  const youtubeStatusPromise = services.youtube.getChannelStatus();

  return Promise.allSettled([twitchStatusPromise, youtubeStatusPromise]).then((results) => {
    const now = moment();
    let totalViewers = 0;
    let twitchViewers = 0;
    let youtubeViewers = 0;

    let twitchStatus;
    let youtubeStatus;
    if (results[0].status === 'rejected') {
      services.logger.error('Could not get Twitch status', results[0].reason);
    } else {
      twitchStatus = results[0].value;
    }
    if (results[1].status === 'rejected') {
      services.logger.error('Could not get YouTube status', results[1].reason);
    } else {
      youtubeStatus = results[1].value;
    }

    if ((!twitchStatus || !twitchStatus.isLive) && (!youtubeStatus || !youtubeStatus.isLive)) {
      const formattedDuration = formatDuration(moment.duration(now.diff(twitchStatus.stopped)));

      return new CommandOutput(
        null,
        `Stream was last online ${formattedDuration} ago. Time Streamed: ${formatDuration(
          twitchStatus.duration,
        )}`,
      );
    }

    if (twitchStatus && twitchStatus.isLive) {
      twitchViewers = parseInt(twitchStatus.viewers, 10);
      totalViewers += twitchViewers;
    }
    if (youtubeStatus && youtubeStatus.isLive) {
      youtubeViewers = parseInt(youtubeStatus.viewers, 10);
      totalViewers += youtubeViewers;
    }

    const formattedDuration = formatDuration(moment.duration(now.diff(twitchStatus.started)));
    if (twitchViewers && youtubeViewers) {
      return new CommandOutput(
        null,
        `Viewers: ${totalViewers}, TTV: ${twitchViewers}, YT: ${youtubeViewers}. Stream live as of ${formattedDuration} ago`,
      );
    }
    return new CommandOutput(
      null,
      `Viewers: ${totalViewers}. Stream live as of ${formattedDuration} ago`,
    );
  });
}

module.exports = new Command(live, true, false, null);
