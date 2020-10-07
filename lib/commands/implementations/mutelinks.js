const moment = require('moment');
const _ = require('lodash');

const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const parseDurationToSeconds = require('../../chat-utils/duration-parser');
const { makeMute } = require('../../chat-utils/punishment-helpers');
const formatDuration = require('../../chat-utils/format-duration');

function mutelinks(defaultPunishmentDuration) {
  // States: "on" | "off" | "all"
  let state = 'off';
  // The user to be mentioned, if null then don't care about mention
  let mentionUser = null;

  return (input, services, rawMessage) => {
    const matched = /(on|off|all)(?:\s+)(\d+[HMDSWwhmds])?/.exec(input);
    const newState = _.get(matched, 1, '');
    const duration = _.get(matched, 2, '');

    let parsedDuration = defaultPunishmentDuration;
    if (duration !== '') {
      parsedDuration = parseDurationToSeconds(duration);
      if (parsedDuration === null) {
        return new CommandOutput(
          null,
          'Could not parse the duration. Usage: "!mutelinks {on,off,all} {amount}{m,h,d,w}" !mutelinks on 10m',
        );
      }
    }

    const newMentionUser = newState === 'on' ? rawMessage.user : null;
    if (newState === state && newMentionUser === mentionUser) {
      const displayState = state === 'all' ? 'on for all links' : state;
      const displayMentionUser = mentionUser ? ` for mentioning ${mentionUser}` : '';
      return new CommandOutput(null, `Link muting is already ${displayState}${displayMentionUser}`);
    }

    state = newState;
    mentionUser = newMentionUser;
    services.messageRelay.stopRelay('mutelinks');
    if (state === 'off') {
      return new CommandOutput(null, `Link muting turned off`);
    }
    const listener = services.messageRelay.startListenerForChatMessages('mutelinks');

    listener.on('message', data => {
      const message = data.message.trim().toLowerCase();
      if (state !== 'all' && !services.messageMatching.mentionsUser(message, mentionUser)) return;
      if (!services.messageMatching.hasLink(message)) return;

      const formattedDuration = formatDuration(moment.duration(parsedDuration, 'seconds'));
      services.punishmentStream.write(
        makeMute(
          data.user,
          parsedDuration,
          `${data.user} muted for ${formattedDuration} for posting a link during a link mute.`,
        ),
        true,
      );
    });
    const displayState = state === 'all' ? 'on for all links' : state;
    const displayMentionUser = mentionUser ? ` for mentioning ${mentionUser}` : '';
    return new CommandOutput(null, `Link muting turned ${displayState}${displayMentionUser}`);
  };
}

module.exports = {
  mutelinks: new Command(
    mutelinks(600),
    false,
    true,
    /(on|off|all)(?:\s+)(\d+[HMDSWwhmds])?/,
    false,
  ),
};
