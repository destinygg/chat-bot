const moment = require('moment');

const Command = require('../command-interface');
const CommandOutput = require('../command-output');
const { makeBan } = require('../../chat-utils/punishment-helpers');
const basePunishmentHelper = require('../base-punishment-helper');
const formatDuration = require('../../chat-utils/format-duration');

let voteBanStarted = false;
function voteBan(ipBan, defaultBanTime) {
  return function ban(input, services, rawMessage) {
    if (voteBanStarted) {
      return new CommandOutput(null, 'Vote ban in progress. Please wait for the current vote to finish.');
    }
    const parsedInput = basePunishmentHelper(input, defaultBanTime)[0];
    if (parsedInput === false) {
      return new CommandOutput(null, 'Could not parse the duration. Usage: "!voteban {amount}{m,h,d,w}OR{perm} {user}" !voteban 1d Destiny');
    }
    const {
      isPermanent, userToPunish, parsedDuration, parsedReason,
    } = parsedInput;

    voteBanStarted = true;
    const listener = services.messageRelay.startListenerForChatMessages('voteban');
    if (listener === false) {
      return new CommandOutput(null, 'Something went wrong?? uhh. Restart me.');
    }

    const muteString = isPermanent ? 'PERMANENTLY' : formatDuration(moment.duration(parsedDuration, 'seconds'));
    const votedMap = {};
    let yes = 0;
    let no = 0;

    listener.on('message', (data) => {
      if (votedMap[data.user]) {
        return;
      }
      const message = data.message.trim();
      if (message.trim() === '1' || message.trim() === '2') {
        votedMap[data.user] = true;
        // eslint-disable-next-line no-unused-expressions
        message.trim() === '1' ? yes += 1 : no += 1;
      }
    });

    setTimeout(() => {
      voteBanStarted = false;
      services.messageRelay.stopRelay('voteban');
      services.messageRelay.sendOutputMessage('Total votes:');
      services.messageRelay.sendOutputMessage(`Yes votes: ${yes}`);
      services.messageRelay.sendOutputMessage(`No votes: ${no}`);
      if (yes < no) {
        services.messageRelay.sendOutputMessage(`No votes win by ${no - yes} votes, ${userToPunish} is safe for now.. AYAYA `);
        return;
      }
      services.punishmentStream.write(makeBan(userToPunish, parsedDuration, ipBan, isPermanent,
        `${userToPunish} banned through bot by a VOTE BAN started by ${rawMessage.user}. ${parsedReason ? `Reason: ${parsedReason}` : ''} Yes votes: ${yes} No Votes: ${no}`));
    }, 30500);

    return new CommandOutput(null, `/vote Should we ban ${userToPunish} ${muteString === 'PERMANENTLY' ? muteString : `for ${muteString}`} ${parsedReason ? ` Reason: ${parsedReason}` : ''}? yes or no 30s`);
  };
}

module.exports = {
  voteIpban: new Command(voteBan(true, 'perm'), false, true, /((?:\d+[HMDSWwhmds])|(?:perm))?\s?(\w+)(?:\s(.*))?/, null),
  voteBan: new Command(voteBan(false, 600), false, true, /((?:\d+[HMDSWwhmds])|(?:perm))?\s?(\w+)(?:\s(.*))?/, null),
};
