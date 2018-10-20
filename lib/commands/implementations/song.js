const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function getCurrentPlayingSongForBroadcaster(input, services) {
  return services.lastfm.getCurrentPlayingSong()
    .then((song) => {
      const profilePageUrl = services.lastfm.getProfilePage();
      if (!song) {
        return new CommandOutput(null, null, `So songs played for ${profilePageUrl}`);
      }
      if (song.nowPlaying) {
        return new CommandOutput(null, null, `"${song.trackName} - ${song.artistName}" ${profilePageUrl}`);
      }
      return new CommandOutput(null, null, `Not playing any songs. Last played "${song.trackName} - ${song.artistName}" ${song.playedAgo.humanize(true)} ${profilePageUrl}`);
    })
    .catch(err => new CommandOutput(err, "Oops. Something didn't work. Check the logs.", null));
}

module.exports = new Command(getCurrentPlayingSongForBroadcaster, true, false, null);
