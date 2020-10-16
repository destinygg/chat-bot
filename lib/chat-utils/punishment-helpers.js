/**
 * @param {string} user
 * @param {number} durationSeconds
 * @param {string} reason
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
 * @param {string} user
 */
function makeUnmute(user) {
  return {
    user,
    type: 'unmute',
  };
}

/**
 * @param {string} user
 * @param {number} durationSeconds
 * @param {boolean} ipban
 * @param {boolean} isPermanent
 * @param {string} reason
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
 * @param {string} user
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
