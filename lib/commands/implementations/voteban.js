const moment = require('moment');
const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const { makeBan } = require('../../chat-utils/punishment-helpers');
const basePunishmentHelper = require('../base-punishment-helper');
const formatDuration = require('../../chat-utils/format-duration');

function voteBan(ipBan, defaultBanTime, weighted) {
  const pollDuration = 30000;

  let failSafeTimeout = null;
  let votebanActive = false;

  return function ban(input, services, rawMessage) {
    if (votebanActive) {
      return new CommandOutput(
        null,
        'Vote ban in progress. Please wait for the current vote ban to finish.',
      );
    }

    const parsedInput = basePunishmentHelper(input, defaultBanTime)[0];

    if (parsedInput === false) {
      return new CommandOutput(
        null,
        'Could not parse the duration. Usage: "!voteban {amount}{m,h,d,w}OR{perm} {user}" !voteban 1d Destiny',
      );
    }

    const { isPermanent, userToPunish, parsedDuration, parsedReason } = parsedInput;
    const muteString = isPermanent
      ? 'PERMANENTLY'
      : formatDuration(moment.duration(parsedDuration, 'seconds'));

    const listener = services.messageRelay.startListenerForChatMessages('voteban');
    if (listener === false) {
      return new CommandOutput(null, 'Something went wrong?? uhh. Restart me.');
    }

    listener.on('err', (message) => {
      const error = JSON.parse(message);
      if (error.description === 'activepoll' && !votebanActive) {
        clearTimeout(failSafeTimeout);
        services.messageRelay.stopRelay('voteban');
        services.messageRelay.sendOutputMessage(
          'Poll in progress. Please wait for the current poll to finish.',
        );
      }
    });

    listener.on('pollstart', () => {
      votebanActive = true;
      services.messageRelay.sendOutputMessage(
        `Should we ban ${userToPunish} ${
          muteString === 'PERMANENTLY' ? muteString : `for ${muteString}`
        } ${parsedReason ? ` Reason: ${parsedReason}` : ''}?`,
      );

      // Fail-safe
      failSafeTimeout = setTimeout(() => {
        votebanActive = false;
        services.messageRelay.stopRelay('voteban');
      }, pollDuration + 5000);
    });

    listener.on('pollstop', (message) => {
      clearTimeout(failSafeTimeout);
      votebanActive = false;
      services.messageRelay.stopRelay('voteban');

      services.messageRelay.sendOutputMessage('Total votes:');

      const poll = JSON.parse(message);
      const votes = _.zipObject(poll.options, poll.totals);

      services.messageRelay.sendOutputMessage(`Yes votes: ${votes.yes}`);
      services.messageRelay.sendOutputMessage(`No votes: ${votes.no}`);

      if (votes.yes <= votes.no) {
        services.messageRelay.sendOutputMessage(
          `No votes win by ${votes.no - votes.yes} votes, ${userToPunish} is safe for now.. AYAYA `,
        );
        return;
      }

      services.punishmentStream.write(
        makeBan(
          userToPunish,
          parsedDuration,
          ipBan,
          isPermanent,
          `${userToPunish} banned through bot by a VOTE BAN started by ${rawMessage.user}. ${
            parsedReason ? `Reason: ${parsedReason}` : ''
          } Yes votes: ${votes.yes} No Votes: ${votes.no}`,
        ),
      );
    });

    services.messageRelay.emit(
      'poll',
      JSON.stringify({
        weighted,
        time: pollDuration,
        question: `Should we ban ${userToPunish} ${
          muteString === 'PERMANENTLY' ? muteString : `for ${muteString}`
        } ${parsedReason ? ` Reason: ${parsedReason}` : ''}`,
        options: ['yes', 'no'],
      }),
    );

    return new CommandOutput(null, '');
  };
}

module.exports = {
  voteIpban: new Command(
    voteBan(true, 'perm', false),
    false,
    true,
    /((?:\d+[HMDSWwhmds])|(?:perm))?\s?(\w+)(?:\s(.*))?/,
    null,
  ),
  voteBan: new Command(
    voteBan(false, 600, false),
    false,
    true,
    /((?:\d+[HMDSWwhmds])|(?:perm))?\s?(\w+)(?:\s(.*))?/,
    null,
  ),
  svoteIpban: new Command(
    voteBan(true, 'perm', true),
    false,
    true,
    /((?:\d+[HMDSWwhmds])|(?:perm))?\s?(\w+)(?:\s(.*))?/,
    null,
  ),
  svoteBan: new Command(
    voteBan(false, 600, true),
    false,
    true,
    /((?:\d+[HMDSWwhmds])|(?:perm))?\s?(\w+)(?:\s(.*))?/,
    null,
  ),
};
