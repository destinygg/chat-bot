const { Transform } = require('stream');
const moment = require('moment');
const _ = require('lodash');
const {
  PRIVILEGED_USER_ROLES,
  PROTECTED_USER_LIST,
} = require('../chat-utils/privileged-user-list');
const formatDuration = require('../chat-utils/format-duration');
const { METRIC_NAMES } = require('./metrics/metric-names');
const { getReporter } = require('./metrics/metrics-reporter');

function formatLength(durationSeconds) {
  return formatDuration(moment.duration(durationSeconds, 'seconds'));
}

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

  // eslint-disable-next-line no-underscore-dangle
  _transform(punished, encoding, callback) {
    // We do this to prevent the bot from auto banning twice.
    if (punished.reason === null && _.includes(this.recentBans, punished.user)) {
      return callback();
    }

    const roles = this.roleCache.getUsersRoles(punished.user);
    if (
      roles !== null &&
      _.some(roles, (role) => PRIVILEGED_USER_ROLES[role] || PROTECTED_USER_LIST[role])
    ) {
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
    getReporter().incrementCounter(METRIC_NAMES.BANS_GIVEN, 1);
    if (punished.isBannedWord === true) {
      const banDuration = this.punishmentCache.getAndAddPunishmentDuration(
        punished.user,
        punished.duration,
      );
      this.push({
        user: punished.user,
        duration: banDuration,
        type: punished.type,
        reason: `${punished.reason} Length: ${formatLength(banDuration)}.`,
      });
      return;
    }

    this.push(punished);
  }

  handleMute(punished) {
    getReporter().incrementCounter(METRIC_NAMES.MUTES_GIVEN, 1);
    let muteDuration = null;
    let muteReason = null;
    if (punished.isBannedWord === true) {
      muteDuration = this.punishmentCache.getAndAddPunishmentDuration(
        punished.user,
        punished.duration,
      );
      this.sendMute(
        `${punished.reason} Length: ${formatLength(muteDuration)}.`,
        muteDuration,
        punished.type,
        punished.user,
      );
      return;
    }

    if (punished.duration === null) {
      muteDuration = this.punishmentCache.getAndAddPunishmentDuration(punished.user);
      muteReason = `Muting ${punished.user} for ${formatLength(
        Math.ceil(muteDuration),
      )} due to spam detection. Reason: ${punished.reason}`;
    } else {
      muteDuration = punished.duration;
      muteReason = punished.reason;
    }
    this.sendMute(muteReason, muteDuration, punished.type, punished.user);
  }

  sendMute(reason, muteDuration, type, user) {
    const clampedMutedDuration = _.clamp(muteDuration, 0, this.punishmentCache.maxMuteSeconds);
    this.push({
      user,
      duration: clampedMutedDuration,
      type,
      reason,
    });
  }
}

module.exports = PunishmentReadWriteStream;
