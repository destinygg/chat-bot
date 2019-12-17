function makeMute(user, durationSeconds, reason, isBannedWord = false) {
  return {
    user,
    duration: durationSeconds,
    type: 'mute',
    reason,
    isBannedWord,
  };
}

function makeUnmute(user) {
  return {
    user,
    type: 'unmute',
  };
}

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
