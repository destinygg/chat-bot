const moment = require('moment');
const _ = require('lodash');

const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const parseDurationToSeconds = require('../../chat-utils/duration-parser');
const formatDuration = require('../../chat-utils/format-duration');

function breakingNews(defaultMaxAge) {
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

    const newMentionUser = newState === 'on' ? _.get(rawMessage, 'user') : null;
    const currentState = services.moderationState.breakingnews || { mode: 'off' };
    const currentMentionUser = currentState.mention || null;

    if (
      newState === currentState.mode &&
      newMentionUser === currentMentionUser &&
      newMaxAge === currentState.maxAge
    ) {
      const displayState = currentState.mode === 'all' ? 'on for all links' : currentState.mode;
      const displayMentionUser = currentMentionUser ? ` for mentioning ${currentMentionUser}` : '';
      const formattedLength = formatDuration(moment.duration(newMaxAge, 'seconds'));
      return new CommandOutput(
        null,
        `Breaking news mode (${formattedLength}) is already ${displayState}${displayMentionUser}`,
      );
    }

    services.moderationState.setBreakingNews({
      mode: newState,
      maxAge: newMaxAge,
      by: _.get(rawMessage, 'user'),
    });

    if (newState === 'off') {
      return new CommandOutput(null, `Breaking news mode turned off`);
    }

    const formattedMaxAge = formatDuration(moment.duration(newMaxAge, 'seconds'));
    const displayState = newState === 'all' ? 'on for all links' : newState;
    const displayMentionUser = newMentionUser ? ` for mentioning ${newMentionUser}` : '';
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
