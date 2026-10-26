const moment = require('moment');
const _ = require('lodash');

const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const parseDurationToSeconds = require('../../chat-utils/duration-parser');
const formatDuration = require('../../chat-utils/format-duration');

function mutelinksFactory(defaultPunishmentDuration) {
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

    const normalizedState = newState === 'repeated' ? 'repeat' : newState;
    const by = _.get(rawMessage, 'user');
    const newMentionUser = normalizedState === 'on' ? by : null;
    const currentState = services.moderationState.mutelinks || { mode: 'off' };
    const currentMentionUser = currentState.mention || null;
    if (
      normalizedState === currentState.mode &&
      newMentionUser === currentMentionUser &&
      newMuteDuration === currentState.duration
    ) {
      const displayState = currentState.mode === 'all' ? 'on for all links' : currentState.mode;
      const displayMentionUser = currentMentionUser ? ` for mentioning ${currentMentionUser}` : '';
      const formattedDuration = formatDuration(moment.duration(newMuteDuration, 'seconds'));
      return new CommandOutput(
        null,
        `Link muting (${formattedDuration}) is already ${displayState}${displayMentionUser}`,
      );
    }

    services.moderationState.setMuteLinks({
      mode: normalizedState,
      duration: newMuteDuration,
      by,
    });

    if (normalizedState === 'off') {
      return new CommandOutput(null, `Link muting turned off`);
    }

    const formattedDuration = formatDuration(moment.duration(newMuteDuration, 'seconds'));
    const displayState = normalizedState === 'all' ? 'on for all links' : normalizedState;
    const displayMentionUser = newMentionUser ? ` for mentioning ${newMentionUser}` : '';
    return new CommandOutput(
      null,
      `Link muting (${formattedDuration}) turned ${displayState}${displayMentionUser}`,
    );
  };
}

module.exports = {
  mutelinks: (defaultPunishmentDuration) =>
    new Command(
      mutelinksFactory(defaultPunishmentDuration),
      false,
      true,
      /(on|off|all|repeat(?:ed)?)(?:(?:\s+)(\d+[HMDSWwhmds]))?/,
      false,
    ),
};
