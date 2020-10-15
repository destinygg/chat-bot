const _ = require('lodash');

/**
 * @param {string} message
 */
function formatMessage(message) {
  return `MSG ${JSON.stringify({ nick: 'botbotbot', data: message })}`;
}

/**
 * @param {string} user
 * @param {number} duration
 */
function formatMute(user, duration) {
  return `MUTE ${JSON.stringify({ data: user, duration: Math.floor(1e9 * duration) })}`;
}

/**
 * @param {string} user
 */
function formatUnmute(user) {
  return `UNMUTE ${JSON.stringify({ data: user })}`;
}

/**
 * @param {string} target
 * @param {number} duration
 * @param {boolean} banip
 * @param {boolean} ispermanent
 * @param {string|false} reason
 */
function formatBan(target, duration, banip, ispermanent, reason) {
  return `BAN ${JSON.stringify({
    nick: target,
    banip,
    duration: Math.floor(1e9 * duration),
    reason: reason === false ? null : reason,
    ispermanent,
  })}`;
}

/**
 * @param {string} user
 */
function formatUnban(user) {
  return `UNBAN ${JSON.stringify({ data: user })}`;
}

/**
 * @typedef ParsedMessage
 * @type {Object}
 * @property {string} user
 * @property {string[]} roles
 * @property {string} message
 */

/**
 * @param {string} message
 * @returns {ParsedMessage}
 */
function parseMessage(message) {
  const parsed = JSON.parse(message.replace('MSG ', ''));
  return { user: parsed.nick, roles: parsed.features, message: parsed.data };
}

/**
 * @typedef ParsedWhisper
 * @type {Object}
 * @property {string} user
 * @property {string} message

/**
 * @param {string} message
 * @returns {ParsedWhisper}
 */
function parseWhisper(message) {
  const parsed = JSON.parse(message.replace('PRIVMSG ', ''));
  return { user: parsed.nick, message: parsed.data };
}

/**
 * @param {string} user
 * @param {string} message
 */
function formatWhisper(user, message) {
  return `PRIVMSG ${JSON.stringify({ nick: user, data: message })}`;
}

/**
 * @typedef ParsedCommand
 * @type {false | Object}
 * @property {string} commandString
 * @property {string} input
 */

/**
 * @param {string} message
 * @returns {ParsedCommand}
 */
function parseCommand(message) {
  const matchedData = /^(!\w+)(\s(.*))?/.exec(message);
  const commandString = _.get(matchedData, 1, null);
  const input = _.get(matchedData, 3, null);
  if (commandString === null && input === null) {
    return false;
  }

  return { commandString: commandString.toLowerCase(), input };
}

module.exports = {
  parseMessage,
  parseCommand,
  formatMessage,
  formatMute,
  formatUnmute,
  formatBan,
  formatUnban,
  parseWhisper,
  formatWhisper,
};
