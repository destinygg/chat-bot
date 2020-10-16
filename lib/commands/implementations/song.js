const Command = require('../command-interface');
const CommandOutput = require('../command-output');

/**
 * @param {string} input
 * @param {import("../../services/service-index")} services
 */
function getCurrentPlayingSongForBroadcaster(input, services) {
  return services.lastfm
    .getCurrentPlayingSong()
    .then((song) => {
      const profilePageUrl = services.lastfm.getProfilePage();
      if (song === null) {
        return new CommandOutput(null, `So songs played for ${profilePageUrl}`);
      }
      if (song.nowPlaying) {
        return new CommandOutput(
          null,
          `"${song.trackName} - ${song.artistName}" ${profilePageUrl}`,
        );
      }
      return new CommandOutput(
        null,
        `Not playing any songs. Last played "${song.trackName} - ${
          song.artistName
        }" ${song.playedAgo.humanize(true)} ${profilePageUrl}`,
      );
    })
    .catch((err) => new CommandOutput(err, "Oops. Something didn't work. Check the logs."));
}

module.exports = new Command(getCurrentPlayingSongForBroadcaster, true, false, null);
