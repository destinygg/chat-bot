

function makeMute(user, durationSeconds, reason) {
  return {
    user, duration: durationSeconds, type: 'mute', reason,
  };
}

function makeUnmute(user, unmuteMessage) {
  return {
    user, type: 'unmute', reason: unmuteMessage,
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
