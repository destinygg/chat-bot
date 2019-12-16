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

  addUserToAegisCache(user, timeMuted) {
    this.singleUserAegisCache[user] = {
      timestamp: timeMuted + moment().unix(),
    };
  }

  addNukeToCache(userList, nukedPhrase, duration, isMegaNuke) {
    this.aegisCache.push(userList);
    this.nukedPhrases.push({ duration, phrase: nukedPhrase, isMegaNuke });
    setTimeout(() => {
      this.nukedPhrases.shift();
      this.aegisCache.shift();
    }, this.nukeLingerSeconds * 1000);
  }

  getNukedPhrases() {
    return this.nukedPhrases;
  }

  cleaseNukes() {
    this.nukedPhrases = [];
    this.singleUserAegisCache = {};
  }

  getNukedUsers() {
    const singleUsers = _.keys(this.singleUserAegisCache);
    return _.flatten(_.concat(this.aegisCache, singleUsers));
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
