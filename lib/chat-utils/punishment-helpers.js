

function makeMute(user, durationSeconds, reason) {
  return {
    user, durationSeconds, type: 'mute', reason,
  };
}

function makeUnmute(user, unmuteMessage) {
  return {
    user, type: 'unmute', reason: unmuteMessage,
  };
}

function makeBan(user, durationSeconds, reason) {
  return {
    user, durationSeconds, type: 'ban', reason,
  };
}

module.exports = { makeBan, makeMute, makeUnmute };
