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
    switch (punished.type) {
      case 'mute':
        this.handleMute(punished);
        break;
      case 'ban':
        this.push(punished);
        break;
      case 'unmute':
        this.push(punished);
        break;
      case 'unban':
        this.push(punished);
        break;
      default:
        break;
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
