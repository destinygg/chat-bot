const { Transform } = require('stream');
const _ = require('lodash');
const PRIVILEGED_USER_ROLES = require('../chat-utils/privileged-user-list');

class PunishmentReadWriteStream extends Transform {
  constructor(services) {
    super({
      readableObjectMode: true,
      writableObjectMode: true,
    });
    this.punishmentCache = services.punishmentCache;
    this.roleCache = services.roleCache;
    this.recentBans = [];
    this.logger = services.logger;

    // Quick easy way to clear the cache.
    setInterval(() => {
      this.recentBans = [];
    }, 15000);
  }

  addUserToRecentBanList(user) {
    if (this.recentBans.length >= 10) {
      this.recentBans.shift();
    }

    this.recentBans.push(user);
  }

  _transform(punished, encoding, callback) {
    // We do this to prevent the bot from auto banning twice.
    if (punished.reason === null
      && _.includes(this.recentBans, punished.user)) {
      return callback();
    }

    const roles = this.roleCache.getUsersRoles(punished.user);
    if (roles !== null && _.some(roles, role => PRIVILEGED_USER_ROLES[role])) {
      this.logger.info(`Preventing ban of protected user: ${punished.user}`);
      return callback();
    }

    this.addUserToRecentBanList(punished.user);
    switch (punished.type) {
      case 'mute':
        this.handleMute(punished);
        break;
      case 'ban':
        this.handleBan(punished);
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
    return callback();
  }

  handleBan(punished) {
    if (punished.isBannedWord === true) {
      const banDuration = this.punishmentCache.getAndAddPunishmentDuration(
        punished.user, punished.duration,
      );
      this.push({
        user: punished.user,
        duration: banDuration,
        type: punished.type,
        reason: `${punished.reason} Length: ${banDuration} seconds.`,
      });
      return;
    }

    this.push(punished);
  }

  handleMute(punished) {
    let muteDuration = null;
    let muteReason = null;
    if (punished.isBannedWord === true) {
      muteDuration = this.punishmentCache.getAndAddPunishmentDuration(
        punished.user, punished.duration,
      );
      this.push({
        user: punished.user,
        duration: muteDuration,
        type: punished.type,
        reason: `${punished.reason} Length: ${muteDuration} seconds.`,
      });
      return;
    }

    if (punished.duration === null) {
      muteDuration = this.punishmentCache.getAndAddPunishmentDuration(punished.user);
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
