const moment = require('moment');
const _ = require('lodash');

const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const { makeMute } = require('../../chat-utils/punishment-helpers');
const parseDurationToSeconds = require('../../chat-utils/duration-parser');
const formatDuration = require('../../chat-utils/format-duration');

function breakingNews(defaultMaxAge) {
  let enabled = false;

  return (input, services, rawMessage) => {
    const matched = /(\d+[HMDShmds])?/.exec(input);
    const maxAgeStr = _.get(matched, 1, defaultMaxAge).toLowerCase();

    enabled = !enabled;

    if (!enabled) {
      services.messageRelay.stopRelay('breakingnews');
      return new CommandOutput(null, 'Breaking News mode turned off.');
    }

    const maxAge = parseDurationToSeconds(maxAgeStr);
    const listener = services.messageRelay.startListenerForChatMessages('breakingnews');
    listener.on('message', (data) => {
      const message = data.message.trim().toLowerCase();
      if (!services.messageMatching.hasTwitterLink(message)) return;
      services.twitterApi
        .getTweetDatetimeFromMessage(message)
        .then((datetime) => {
          const diff = moment().diff(datetime);
          if (diff > maxAge * 1000) {
            const muteDuration = diff / 1000 - maxAge;
            const formattedDuration = formatDuration(moment.duration(muteDuration, 'seconds'));
            services.punishmentStream.write(
              makeMute(
                data.user,
                muteDuration,
                `${data.user} muted for ${formattedDuration} for posting a link older than ${maxAgeStr}.`,
              ),
              true,
            );
          }
        })
        .catch(() => {
          /* relevant errors already logged */
        });
    });
    return new CommandOutput(
      null,
      `Breaking news mode turned on. Tweets older than ${maxAgeStr} will get muted.`,
    );
  };
}

module.exports = {
  breakingNews: new Command(
    breakingNews('5m'),
    false,
    true,
    /(?:(on|off)(?:\s+(\d+[HMDShmds]))?)?/,
    false,
  ),
};
