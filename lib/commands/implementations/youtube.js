const moment = require('moment');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function getLatestVideo(input, services) {
  return services.youtube
    .getLatestUploadedVideo()
    .then(
      (latestVideo) =>
        new CommandOutput(
          null,
          `"${latestVideo.title}" posted ${moment(
            latestVideo.publishDate,
          ).fromNow()} https://youtu.be/${latestVideo.id}`,
        ),
    )
    .catch((err) => new CommandOutput(err, "Oops. Something didn't work. Check the logs."));
}

module.exports = new Command(getLatestVideo, true, false, null);
