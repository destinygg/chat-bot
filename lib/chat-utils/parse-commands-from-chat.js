const _ = require('lodash');

function formatMessage(message) {
  return `MSG ${JSON.stringify({ nick: 'bottybot', message })}`;
}

function parseMessage(message) {
  const parsed = JSON.parse(message.replace('MSG ', ''));
  return { user: parsed.nick, message: parsed.message };
}

function parseCommand(message) {
  const matchedData = /(!\w+)(\s(.*))?/.exec(message);
  const commandString = _.get(matchedData, 1, null);
  const input = _.get(matchedData, 3, null);
  if (commandString === null && input === null) {
    return false;
  }

  return { commandString: commandString.toLowerCase(), input };
}

module.exports = { parseMessage, parseCommand, formatMessage };
