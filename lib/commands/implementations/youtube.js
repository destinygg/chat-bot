const moment = require('moment');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function getLatestVideo(input, services) {
  return services.youtube.getLatestUploadedVideo()
    .then(latestVideo => new CommandOutput(null, `"${latestVideo.snippet.title}" posted ${moment(latestVideo.snippet.publishedAt).fromNow()} https://youtu.be/${latestVideo.snippet.resourceId.videoId}`))
    .catch(err => new CommandOutput(err, "Oops. Something didn't work. Check the logs."))
  }

module.exports = new Command(getLatestVideo, true, false, null);
