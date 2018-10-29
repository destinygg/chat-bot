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
      if ((now - value.timestamp) >= this.timeToLive) {
        delete this.punishedViewersMap[key];
      }
    });
  }

  addNukeToAegis(userList) {
    this.aegisCache = userList;
  }

  getLastNukeList() {
    return this.aegisCache;
  }

  getAndAddPunishmentDuration(viewer, duration = 0) {
    const foundViewer = _.get(this.punishedViewersMap, viewer, false);
    if (foundViewer !== false) {
      const newDuration = foundViewer.duration * this.muteGrowthMultiplier;
      foundViewer.duration = newDuration > duration ? newDuration : duration;
      foundViewer.timestamp = moment().unix();
      return foundViewer.duration;
    }
    const assignedDuration = duration === 0 ? this.baseMuteSeconds : duration;

    this.punishedViewersMap[viewer] = {
      duration: assignedDuration,
      timestamp: moment().unix(),
    };
    return assignedDuration;
  }
}

module.exports = PunishmentCache;
