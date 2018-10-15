const _ = require('lodash');
const moment = require('moment');

class PunishmentCache {
  constructor(config) {
    this.baseMuteSeconds = config.baseMuteSeconds || 120;
    this.muteGrowthMultipler = config.muteGrowthMultipler || 2;
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
      if ((now - value.timestamp) >= this.timeToLive) {
        delete this.punishedViewersMap[key];
      }
    });
  }


  getAndAddMuteDuration(viewer) {
    const foundViewer = _.get(this.punishedViewersMap, viewer, false);
    if (foundViewer !== false) {
      const newDuration = foundViewer.duration * this.muteGrowthMultipler;
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
