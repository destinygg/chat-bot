const _ = require('lodash');
const moment = require('moment');

class PunishmentCache {
  constructor(config) {
    this.baseMuteSeconds = config.baseMuteSeconds || 120;
    this.muteGrowthMultiplier = config.muteGrowthMultiplier || 2;
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

  getAndAddMuteDuration(viewer) {
    const foundViewer = _.get(this.punishedViewersMap, viewer, false);
    if (foundViewer !== false) {
      const newDuration = foundViewer.duration * this.muteGrowthMultiplier;
      foundViewer.duration = newDuration;
      foundViewer.timestamp = moment().unix();
      return newDuration;
    }

    this.punishedViewersMap[viewer] = {
      duration: this.baseMuteSeconds,
      timestamp: moment().unix(),
    };
    return this.baseMuteSeconds;
  }
}

module.exports = PunishmentCache;
