const moment = require('moment');
const formatDuration = require('../../chat-utils/format-duration');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function live(input, services) {
  return services.dggApi.getStreamInfo().then((data) => {
    const now = moment();

    const isLive = () => {
      return data.some((s) => s?.live);
    };

    const oldestStartedLiveStream = () => {
      return data.filter((s) => s?.live).sort((a, b) => (a.started_at < b.started_at ? -1 : 1))[0];
    };

    const newestEndedStream = () => {
      return data
        .filter((s) => s?.live === false)
        .sort((a, b) => (a?.ended_at > b?.ended_at ? -1 : 1))[0];
    };

    const totalViewers = () => {
      return data.filter((s) => s?.live).reduce((acc, s) => acc + s.viewers, 0);
    };

    if (!isLive()) {
      const { duration, ended_at } = newestEndedStream() ?? {};
      if (duration && ended_at) {
        const endedAgo = formatDuration(moment.duration(now.diff(ended_at)));
        const friendlyDuration = formatDuration(moment.duration(duration, 'seconds'));
        return new CommandOutput(
          null,
          `Stream was last online ${endedAgo} ago. Time Streamed: ${friendlyDuration}.`,
        );
      } else {
        return new CommandOutput(null, 'Stream is offline.');
      }
    }

    const { viewers, started_at } = oldestStartedLiveStream();
    const startedAgo = formatDuration(moment.duration(now.diff(started_at)));
    return new CommandOutput(
      null,
      `Viewers: ${totalViewers()}. Stream live as of ${startedAgo} ago.`,
    );
  });
}

module.exports = new Command(live, true, false, null);
