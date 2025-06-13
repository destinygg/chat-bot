const moment = require('moment');
const _ = require('lodash');

const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const parseDurationToSeconds = require('../../chat-utils/duration-parser');
const { makeMute } = require('../../chat-utils/punishment-helpers');
const formatDuration = require('../../chat-utils/format-duration');
const normalizeUrl = require('../../chat-utils/normalize-url');

function mutelinks(defaultPunishmentDuration) {
  // States: "on" | "off" | "all" | "repeated"
  let state = 'off';
  // The user to be mentioned, if null then don't care about mention
  let mentionUser = null;

  let muteDuration = null;

  return (input, services, rawMessage) => {
    const matched = /(on|off|all|repeat(?:ed)?)(?:(?:\s+)(\d+[HMDSWwhmds]))?/.exec(input);
    const newState = _.get(matched, 1, '');
    const duration = _.get(matched, 2, '');

    let newMuteDuration = defaultPunishmentDuration;
    if (duration !== '') {
      newMuteDuration = parseDurationToSeconds(duration);
      if (newMuteDuration === null) {
        return new CommandOutput(
          null,
          'Could not parse the duration. Usage: "!mutelinks {on,off,all,repeat(ed)} {amount}{m,h,d,w}" !mutelinks on 10m',
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
    if (state === 'on') {
      listener.on('msg', (data) => {
        const message = data.message.trim().toLowerCase();
        if (!services.messageMatching.mentionsUser(message, mentionUser)) return;
        if (!services.messageMatching.hasLink(message)) return;

        services.punishmentStream.write(
          makeMute(
            data.user,
            muteDuration,
            `${data.user} muted for ${formattedDuration} for tagging ${mentionUser} with a link.`,
          ),
        );
      });
    } else if (state === 'all') {
      listener.on('msg', (data) => {
        const message = data.message.trim().toLowerCase();
        if (!services.messageMatching.hasLink(message)) return;

        services.punishmentStream.write(
          makeMute(
            data.user,
            muteDuration,
            `${data.user} muted for ${formattedDuration} for posting a link while link muting is on.`,
          ),
        );
      });
    } else if (state === 'repeat' || state === 'repeated') {
      listener.on('msg', (data) => {
        const message = data.message.trim().toLowerCase();
        if (!services.messageMatching.hasLink(message)) return;

        const links = services.messageMatching.getLinks(message);
        const recentUrls = services.chatCache.getRecentUrls();

        const hasRepeatedLink = links.some((link) => {
          const normalizedUrl = normalizeUrl(link);
          return recentUrls.includes(normalizedUrl);
        });

        if (hasRepeatedLink) {
          services.punishmentStream.write(
            makeMute(
              data.user,
              muteDuration,
              `${data.user} muted for ${formattedDuration} for posting a repeated link.`,
            ),
          );
        }
      });
    }

    const displayState = state === 'all' ? 'on for all links' : state;
    const displayMentionUser = mentionUser ? ` for mentioning ${mentionUser}` : '';
    return new CommandOutput(
      null,
      `Link muting (${formattedDuration}) turned ${displayState}${displayMentionUser}`,
    );
  };
}

module.exports = {
  mutelinks: new Command(
    mutelinks(60),
    false,
    true,
    /(on|off|all|repeat(?:ed)?)(?:(?:\s+)(\d+[HMDSWwhmds]))?/,
    false,
  ),
};
