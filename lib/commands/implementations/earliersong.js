const Command = require('../command-interface');
const CommandOutput = require('../command-output');

/**
 * @param {string} input
 * @param {import("../../services/service-index")} services
 */
function getPreviousPlayingSongForBroadcaster(input, services) {
  return services.lastfm
    .getPreviousSongPlaying()
    .then((song) => {
      const profilePageUrl = services.lastfm.getProfilePage();
      if (song === null) {
        return new CommandOutput(null, `Could not find any songs played for ${profilePageUrl}`);
      }
      return new CommandOutput(
        null,
        `"${song.previouslyPlayedTrackName} - ${song.previouslyPlayedArtistName}" played before "${
          song.lastPlayedTrackName
        } - ${song.lastPlayedArtistName}" ${song.playedAgo.humanize(true)} ${profilePageUrl}`,
      );
    })
    .catch((err) => new CommandOutput(err, "Oops. Something didn't work. Check the logs."));
}

module.exports = new Command(getPreviousPlayingSongForBroadcaster, true, false, null);
