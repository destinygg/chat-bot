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
    this.timeToLive = config.timeToLiveSeconds || 1800;
    this.tombStoneInterval = config.tomeStoneIntervalMilliseconds || 120000;
    this.startTombStoneInterval();
  }

  startTombStoneInterval() {
    setInterval(() => {
      this.tombStoneCleanup();
    }, this.tombStoneInterval);
  }

  tombStoneCleanup() {
    if (_.isEmpty(this.punishedViewersMap)) {
      return;
    }
    const now = moment().unix();
    _.forIn(this.punishedViewersMap, (value, key) => {
      if (now - value.timestamp >= this.timeToLive) {
        delete this.punishedViewersMap[key];
      }
    });
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
