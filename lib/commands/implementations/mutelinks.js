const moment = require('moment');
const _ = require('lodash');

const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const parseDurationToSeconds = require('../../chat-utils/duration-parser');
const { makeMute } = require('../../chat-utils/punishment-helpers');
const formatDuration = require('../../chat-utils/format-duration');

/**
 * @param {number} defaultPunishmentDuration
 */
function mutelinks(defaultPunishmentDuration) {
  /**
   * @type {("on"|"off"|"all")}
   */
  let state = 'off';
  // The user to be mentioned, if null then don't care about mention
  let mentionUser = null;

  let muteDuration = null;

  /**
   * @param {string} input
   * @param {import("../../services/service-index")} services
   * @param {import("../../chat-utils/parse-commands-from-chat").ParsedMessage} rawMessage
   */
  function handler(input, services, rawMessage) {
    const matched = /(on|off|all)(?:(?:\s+)(\d+[HMDSWwhmds]))?/.exec(input);
    const newState = /** @type {("on"|"off"|"all")} */ (_.get(matched, 1, ''));
    const duration = _.get(matched, 2, '');

    let newMuteDuration = defaultPunishmentDuration;
    if (duration !== '') {
      newMuteDuration = parseDurationToSeconds(duration);
      if (newMuteDuration === null) {
        return new CommandOutput(
          null,
          'Could not parse the duration. Usage: "!mutelinks {on,off,all} {amount}{m,h,d,w}" !mutelinks on 10m',
        );
      }
    }

    const newMentionUser = newState === 'on' ? rawMessage.user : null;
    if (newState === state && newMentionUser === mentionUser && muteDuration === newMuteDuration) {
      const displayState = state === 'all' ? 'on for all links' : state;
      const displayMentionUser = mentionUser ? ` for mentioning ${mentionUser}` : '';
      const formattedDuration = formatDuration(moment.duration(muteDuration, 'seconds'));
      return new CommandOutput(
        null,
        `Link muting (${formattedDuration}) is already ${displayState}${displayMentionUser}`,
      );
    }

    state = newState;
    mentionUser = newMentionUser;
    muteDuration = newMuteDuration;
    services.messageRelay.stopRelay('mutelinks');
    if (state === 'off') {
      return new CommandOutput(null, `Link muting turned off`);
    }
    const listener = services.messageRelay.startListenerForChatMessages('mutelinks');

    const formattedDuration = formatDuration(moment.duration(muteDuration, 'seconds'));
    listener.on('message', (data) => {
      const message = data.message.trim().toLowerCase();
      if (state !== 'all' && !services.messageMatching.mentionsUser(message, mentionUser)) return;
      if (!services.messageMatching.hasLink(message)) return;

      services.punishmentStream.write(
        makeMute(
          data.user,
          muteDuration,
          `${data.user} muted for ${formattedDuration} for posting a link while link muting is on.`,
        ),
      );
    });
    const displayState = state === 'all' ? 'on for all links' : state;
    const displayMentionUser = mentionUser ? ` for mentioning ${mentionUser}` : '';
    return new CommandOutput(
      null,
      `Link muting (${formattedDuration}) turned ${displayState}${displayMentionUser}`,
    );
  }
  return handler;
}

module.exports = {
  mutelinks: new Command(
    mutelinks(600),
    false,
    true,
    /(on|off|all)(?:(?:\s+)(\d+[HMDSWwhmds]))?/,
    false,
  ),
};
