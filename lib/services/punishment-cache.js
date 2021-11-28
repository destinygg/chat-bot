const _ = require('lodash');
const moment = require('moment');

/**
 * @typedef PunishedViewer
 * @type {Object}
 * @property {number} timestamp
 * @property {number} duration
 */

class PunishmentCache {
  constructor(config) {
    this.baseMuteSeconds = config.baseMuteSeconds || 120;
    this.muteGrowthMultiplier = config.muteGrowthMultiplier || 2;
    this.maxMuteSeconds = config.maxMuteSeconds || 86400; // 86400s = 24h

    /**
     * @type {Object.<string, PunishedViewer>}
     */
    this.punishedViewersMap = {};
    this.aegisCache = [];
    this.singleUserAegisCache = {};
    this.timeToLive = config.timeToLiveSeconds || 1800;
    this.tombStoneInterval = config.tomeStoneIntervalMilliseconds || 120000;
    this.nukeLingerSeconds = config.nukeLingerSeconds || 300;
    this.nukedPhrases = [];
    this.startTombStoneInterval();
  }

  startTombStoneInterval() {
    setInterval(() => {
      this.tombStoneCleanup();
    }, this.tombStoneInterval);
  }

  tombStoneCleanup() {
    if (_.isEmpty(this.punishedViewersMap) && _.isEmpty(this.singleUserAegisCache)) {
      return;
    }
    const now = moment().unix();
    _.forIn(this.punishedViewersMap, (value, key) => {
      if (now - value.timestamp >= this.timeToLive) {
        delete this.punishedViewersMap[key];
      }
    });

    _.forIn(this.singleUserAegisCache, (value, key) => {
      if (now >= value.timestamp) {
        delete this.punishedViewersMap[key];
      }
    });
  }

  addUserToAegisCache(user, timeMuted, phrase) {
    this.singleUserAegisCache[user] = {
      phrase,
      timestamp: timeMuted + moment().unix(),
    };
  }

  addNukeToCache(userList, nukedPhrase, duration, isMegaNuke) {
    this.aegisCache.push({ nukedPhrase, userList });
    this.nukedPhrases.push({ duration, phrase: nukedPhrase, isMegaNuke });
    userList.forEach((user) => {
      this.addUserToAegisCache(user, duration, nukedPhrase);
    });
    setTimeout(() => {
      this.nukedPhrases.shift();
      this.aegisCache.shift();
    }, this.nukeLingerSeconds * 1000);
  }

  getNukedPhrases() {
    return this.nukedPhrases;
  }

  cleanseSingleNuke(nukeToRemove) {
    this.nukedPhrases = this.nukedPhrases.filter(
      (nukedPhrase) => nukedPhrase.phrase !== nukeToRemove,
    );
  }

  cleanseNukes() {
    this.nukedPhrases = [];
    this.singleUserAegisCache = {};
  }

  getNukedUsersForPhrase(nukePhrase) {
    const users = [];
    _.forIn(this.singleUserAegisCache, (value, key) => {
      if (value.phrase.toLowerCase() === nukePhrase.toLowerCase()) {
        users.push(key);
      }
    });
    return users;
  }

  getNukedUsers() {
    const singleUsers = _.keys(this.singleUserAegisCache);
    const userList = this.aegisCache.map((userEntry) => userEntry.userList);
    return _.flatten(_.concat(userList, singleUsers));
  }

  getAndAddPunishmentDuration(viewer, duration = 0) {
    const foundViewer = _.get(this.punishedViewersMap, viewer, false);
    if (foundViewer !== false) {
      foundViewer.duration = _.clamp(foundViewer.duration * this.muteGrowthMultiplier, 0, 43200);
      foundViewer.timestamp = moment().unix();

      return foundViewer.duration > duration ? foundViewer.duration : duration;
    }

    this.punishedViewersMap[viewer] = {
      duration: this.baseMuteSeconds,
      timestamp: moment().unix(),
    };
    return this.baseMuteSeconds > duration ? this.baseMuteSeconds : duration;
  }
}

module.exports = PunishmentCache;
