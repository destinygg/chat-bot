/**
 * @typedef MakeMuteUser
 * @type {Object}
 * @property {string} user
 * @property {number} duration
 * @property {'mute'} type
 * @property {string} reason
 * @property {boolean} isBannedWord
 */

/**
 * @param {string} user
 * @param {number} durationSeconds
 * @param {string} reason
 * @returns {MakeMuteUser}
 */
function makeMute(user, durationSeconds, reason, isBannedWord = false) {
  return {
    user,
    duration: durationSeconds,
    type: 'mute',
    reason,
    isBannedWord,
  };
}

/**
 * @typedef MakeUnmuteUser
 * @type {Object}
 * @property {string} user
 * @property {'unmute'} type
 */

/**
 * @param {string} user
 * @returns {MakeUnmuteUser}
 */
function makeUnmute(user) {
  return {
    user,
    type: 'unmute',
  };
}

/**
 * @typedef MakeBanUser
 * @type {Object}
 * @property {string} user
 * @property {number} duration
 * @property {'ban'} type
 * @property {string} reason
 * @property {boolean} ipban
 * @property {boolean} isPermanent
 * @property {boolean} isBannedWord
 * @property {boolean} isNuke
 */

/**
 * @param {string} user
 * @param {number} durationSeconds
 * @param {boolean} ipban
 * @param {boolean} isPermanent
 * @param {string} reason
 * @returns {MakeBanUser}
 */
function makeBan(
  user,
  durationSeconds,
  ipban,
  isPermanent,
  reason,
  isBannedWord = false,
  isNuke = false,
) {
  return {
    user,
    duration: durationSeconds,
    type: 'ban',
    reason,
    ipban,
    isPermanent,
    isBannedWord,
    isNuke,
  };
}

/**
 * @typedef MakeUnbanUser
 * @type {Object}
 * @property {string} user
 * @property {'unban'} type
 */

/**
 * @param {string} user
 * @returns {MakeUnbanUser}
 */
function makeUnban(user) {
  return {
    user,
    type: 'unban',
  };
}

module.exports = {
  makeBan,
  makeUnban,
  makeMute,
  makeUnmute,
};
