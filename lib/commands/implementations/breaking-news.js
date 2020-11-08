const moment = require('moment');
const _ = require('lodash');

const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const { makeMute } = require('../../chat-utils/punishment-helpers');
const parseDurationToSeconds = require('../../chat-utils/duration-parser');
const formatDuration = require('../../chat-utils/format-duration');

function breakingNews(defaultMaxAge) {
  // States: "on" | "off" | "all"
  let state = 'off';
  // The user to be mentioned. When `null`, applies to all links
  let mentionUser = null;
  let maxAge = null;

  return (input, services, rawMessage) => {
    const matched = /(on|off|all)(?:(?:\s+)(\d+[HMDSWwhmds]))?/.exec(input);
    const newState = _.get(matched, 1, '').toLowerCase();
    const newMaxAgeStr = _.get(matched, 2, '').toLowerCase();

    let newMaxAge = defaultMaxAge;
    if (newMaxAgeStr) {
      newMaxAge = parseDurationToSeconds(newMaxAgeStr);
      if (!newMaxAge) {
        return new CommandOutput(
          null,
          'Could not parse the max link age. Usage: "!breakingnews {on,off,all} {max link age}{m,h,d,w}" !breakingnews on 5m',
        );
      }
    }

    const newMentionUser = newState === 'on' ? rawMessage.user : null;

    if (newState === state && newMentionUser === mentionUser && maxAge === newMaxAge) {
      const displayState = state === 'all' ? 'on for all links' : state;
      const displayMentionUser = mentionUser ? ` for mentioning ${mentionUser}` : '';
      const formattedLength = formatDuration(moment.duration(maxAge, 'seconds'));
      return new CommandOutput(
        null,
        `Breaking news mode (${formattedLength}) is already ${displayState}${displayMentionUser}`,
      );
    }

    state = newState;
    mentionUser = newMentionUser;
    maxAge = newMaxAge;
    services.messageRelay.stopRelay('breakingnews');
    if (state === 'off') {
      return new CommandOutput(null, `Breaking news mode turned off`);
    }

    const formattedMaxAge = formatDuration(moment.duration(maxAge, 'seconds'));

    const listener = services.messageRelay.startListenerForChatMessages('breakingnews');
    listener.on('message', (data) => {
      const message = data.message.trim().toLowerCase();
      if (state !== 'all' && !services.messageMatching.mentionsUser(message, mentionUser)) return;
      if (!services.messageMatching.hasLink(message)) return;

      const makePunishment = (datetime) => {
        const diff = moment().diff(datetime);
        if (diff > maxAge * 1000) {
          const muteDuration = diff / 1000 - maxAge;
          const formattedDuration = formatDuration(moment.duration(muteDuration, 'seconds'));
          services.punishmentStream.write(
            makeMute(
              data.user,
              muteDuration,
              `${data.user} muted for ${formattedDuration} for posting a link older than ${formattedMaxAge} while breaking news mode is on.`,
            ),
          );
        }
      };

      services.messageMatching.getLinks(message).forEach((link) => {
        if (link.hostname === 'twitter.com') {
          return services.twitterApi
            .getTweetDatetimeFromMessage(message)
            .then((datetime) => {
              return makePunishment(datetime);
            })
            .catch(() => {
              /* relevant errors already logged */
            });
        }
        return services.htmlMetadata
          .getOpenGraphDate(link.href)
          .then((datetime) => {
            return makePunishment(datetime);
          })
          .catch((error) => {
            if (error.message === 'No date found') {
              services.logger.warn(
                `No date found for link (${link.href}) during breaking news mode, please create GitHub issue`,
              );
            } else {
              services.logger.error(error);
            }
          });
      });
    });

    const displayState = state === 'all' ? 'on for all links' : state;
    const displayMentionUser = mentionUser ? ` for mentioning ${mentionUser}` : '';
    return new CommandOutput(
      null,
      `Breaking news mode (${formattedMaxAge}) turned ${displayState}${displayMentionUser}`,
    );
  };
}

module.exports = {
  breakingNews: new Command(
    breakingNews(300),
    false,
    true,
    /(on|off|all)(?:(?:\s+)(\d+[HMDSWwhmds]))?/,
    false,
  ),
};
