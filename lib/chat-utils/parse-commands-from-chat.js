const _ = require('lodash');

function formatMessage(message) {
  return `MSG ${JSON.stringify({ nick: 'botbotbot', data: message })}`;
}

function formatMute(user, duration) {
  return `MUTE ${JSON.stringify({ data: user, duration: Math.floor(1e9 * duration) })}`;
}

function formatUnmute(user) {
  return `UNMUTE ${JSON.stringify({ data: user })}`;
}

function formatBan(target, duration, banip, ispermanent, reason) {
  return `BAN ${JSON.stringify({
    nick: target,
    banip,
    duration: Math.floor(1e9 * duration),
    reason: reason === false ? null : reason,
    ispermanent,
  })}`;
}

function formatUnban(user) {
  return `UNBAN ${JSON.stringify({ data: user })}`;
}

function formatPoll(weighted, time, question, options) {
  return `STARTPOLL ${JSON.stringify({
    weighted,
    time,
    question,
    options,
  })}`;
}

function parseMessage(message) {
  const parsed = JSON.parse(message.replace('MSG ', ''));
  return { user: parsed.nick, roles: parsed.features, message: parsed.data };
}

function parseWhisper(message) {
  const parsed = JSON.parse(message.replace('PRIVMSG ', ''));
  return { user: parsed.nick, message: parsed.data };
}

function formatWhisper(user, message) {
  return `PRIVMSG ${JSON.stringify({ nick: user, data: message })}`;
}

function parseCommand(message) {
  const matchedData = /^(!\w+)(\s(.*))?/.exec(message);
  const commandString = _.get(matchedData, 1, null);
  const input = _.get(matchedData, 3, null);
  if (commandString === null && input === null) {
    return false;
  }

  return { commandString: commandString.toLowerCase(), input };
}

function formatAddPhrase(phrase) {
  return `ADDPHRASE ${JSON.stringify({ data: phrase })}`;
}

function formatRemovePhrase(phrase) {
  return `REMOVEPHRASE ${JSON.stringify({ data: phrase })}`;
}

module.exports = {
  parseMessage,
  parseCommand,
  formatMessage,
  formatMute,
  formatUnmute,
  formatBan,
  formatUnban,
  formatPoll,
  parseWhisper,
  formatWhisper,
  formatAddPhrase,
  formatRemovePhrase,
};
