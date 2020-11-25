const moment = require('moment');
const formatDuration = require('../../chat-utils/format-duration');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function embed(input, services) {
  const youtubeStatusPromise = services.youtube.getChannelStatus();

  return Promise.allSettled([youtubeStatusPromise]).then((results) => {
    const now = moment();

    let youtubeStatus;
    if (results[0].status === 'rejected') {
      services.logger.error('Could not get YouTube status', results[1].reason);
    } else {
      youtubeStatus = results[0].value;
    }

    if (!youtubeStatus || !youtubeStatus.isLive) {
      return new CommandOutput(
        null,
        `Could not get YouTube status. Check yourself at youtube.com/destiny`,
      );
    }
    return new CommandOutput(
      null,
      `#youtube/${youtubeStatus.videoId} click to switch the embed to YouTube`,
    );

  });
}

module.exports = new Command(embed, true, false, null);
