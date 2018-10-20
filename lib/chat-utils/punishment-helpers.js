

function makeMute(user, durationSeconds, reason) {
  return {
    user, duration: durationSeconds, type: 'mute', reason,
  };
}

function makeUnmute(user) {
  return {
    user, type: 'unmute',
  };
}

function makeBan(user, durationSeconds, ipban, isPermanent, reason) {
  return {
    user, duration: durationSeconds, type: 'ban', reason, ipban, isPermanent,
  };
}

function makeUnban(user) {
  return {
    user, type: 'unban',
  };
}

module.exports = {
  makeBan, makeUnban, makeMute, makeUnmute,
};
