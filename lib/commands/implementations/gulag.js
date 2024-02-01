const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const { makeBan } = require('../../chat-utils/punishment-helpers');

function gulag(defaultBanTime) {
  return (input, services, rawMessage) => {
    if (services.messageRelay.pollActive) {
      return new CommandOutput(
        null,
        'Poll in progress. Please wait for the current poll to finish.',
      );
    }

    const {
      isPermanent,
      parsedDuration,
      muteString,
      users: parsedUsers,
    } = services.gulag.parseInput(input, defaultBanTime);
    if (parsedUsers.length > 5) {
      return new CommandOutput(null, 'Too many users to be sent to the gulag, max of 5.');
    }

    const listener = services.messageRelay.startListenerForChatMessages('gulag');
    if (listener === false) {
      return new CommandOutput(null, 'Something went wrong?? uhh. Restart me.');
    }
    listener.on('pollstop', (message) => {
      const poll = JSON.parse(message);

      services.messageRelay.stopRelay('gulag');
      services.messageRelay.sendOutputMessage('GULAG has ended:');

      const winnerVotes = Math.max(...poll.totals);
      const winners = [];
      const losers = [];
      poll.totals.forEach((votes, index) => {
        if (votes === winnerVotes) {
          winners.push({ user: poll.options[index], votes });
        } else {
          losers.push({ user: poll.options[index], votes });
        }
      });
      winners.forEach(({ user, votes }) => {
        services.messageRelay.sendOutputMessage(
          `${user} has won the most votes and will be released from the gulag AYAYA . Votes: ${votes}`,
        );
      });
      losers.forEach(({ user, votes }) => {
        services.punishmentStream.write(
          makeBan(
            user,
            parsedDuration,
            false,
            isPermanent,
            `${user} banned through bot by GULAG battle started by ${rawMessage.user}. Votes: ${votes}`,
          ),
        );
      });
    });

    const users = _.uniq(
      parsedUsers.map((name) => {
        if (name.toLowerCase() === 'random') {
          return services.roleCache.getRecentRandomUsername();
        }
        return name;
      }),
    );

    services.messageRelay.emit(
      'poll',
      JSON.stringify({
        weighted: false,
        time: 30000,
        question: `ENTER THE GULAG. Chatters battling it out to not get a ${muteString} ban. Vote KEEP not KICK!?`,
        options: users,
      }),
    );

    return new CommandOutput(
      null,
      `ENTER THE GULAG. Chatters battling it out to not get a ${muteString} ban. Vote KEEP not KICK!? ${users.join(
        ' vs ',
      )}`,
    );
  };
}
module.exports = {
  gulag: new Command(gulag(600), false, true, /((?:\d+[HMDSWwhmds])|(?:perm))\s.+/, null),
};
