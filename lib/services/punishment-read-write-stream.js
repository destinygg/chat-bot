/* eslint-disable no-underscore-dangle */
const { Transform } = require('stream');

class PunishmentReadWriteStream extends Transform {
  constructor(services) {
    super({
      readableObjectMode: true,
      writableObjectMode: true,
    });
    this.punishmentCache = services.punishmentCache;
  }

  _transform(punished, encoding, callback) {
    if (punished.type === 'mute') {
      this.handleMute(punished);
    } else if (punished.type === 'ban') {
      this.push(punished);
    } else if (punished.type === 'unmute') {
      this.push(punished);
    } else if (punished.type === 'unban') {
      this.push(punished);
    }
    callback();
  }

  handleMute(punished) {
    let muteDuration = null;
    let muteReason = null;

    if (punished.duration === null) {
      muteDuration = this.punishmentCache.getAndAddMuteDuration(punished.user);
      muteReason = `Muting ${punished.user} for ${Math.ceil(muteDuration)} seconds due to spam detection.`;
    } else {
      muteDuration = punished.duration;
      muteReason = punished.reason;
    }

    this.push({
      user: punished.user,
      duration: muteDuration,
      type: punished.type,
      reason: muteReason,
    });
  }
}

module.exports = PunishmentReadWriteStream;
