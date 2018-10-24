const { Transform } = require('stream');
const _ = require('lodash');

class PunishmentReadWriteStream extends Transform {
  constructor(services) {
    super({
      readableObjectMode: true,
      writableObjectMode: true,
    });
    this.punishmentCache = services.punishmentCache;
    this.recentBans = [];

    // Quick easy way to clear the cache.
    setInterval(()=> {
      this.recentBans = [];
    }, 15000)
  }

  addUserToRecentBanList(user) {
    if (this.recentBans.length >= 4) {
      this.recentBans.shift();
    }

    this.recentBans.push(user);
  }

  _transform(punished, encoding, callback) {
    // We do this to prevent the bot from auto banning twice.
    if(punished.reason === null
      && _.includes(this.recentBans, punished.user)) {
      return callback();
    }

    this.addUserToRecentBanList(punished.user);
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
