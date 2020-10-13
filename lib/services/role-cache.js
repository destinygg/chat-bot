const _ = require('lodash');
const moment = require('moment');

class RoleCache {
  constructor(config) {
    this.tombStoneInterval = config.tombStoneIntervalMilliseconds || 120000;
    this.timeToLive = config.timeToLiveSeconds || 21600;
    this.roleMap = {};
    this.startTombStoneInterval();
  }

  addUserRoles(user, roles) {
    this.roleMap[user.toLowerCase()] = { roles, timestamp: moment().unix() };
  }

  getUsersRoles(user) {
    return _.get(this.roleMap, `${user.toLowerCase()}.roles`, null);
  }

  getUsernames() {
    return _.keys(this.roleMap);
  }

  getRecentRandomUsername(secondsBack = 30 * 60) {
    const ts = moment().unix();
    const recentUsers = this.getUsernames().filter(
      (x) => this.roleMap[x].timestamp > ts - secondsBack,
    );

    return _.sample(recentUsers);
  }

  startTombStoneInterval() {
    setInterval(() => {
      this.tombStoneCleanup();
    }, this.tombStoneInterval);
  }

  tombStoneCleanup() {
    if (_.isEmpty(this.roleMap)) {
      return;
    }
    const now = moment().unix();
    _.forIn(this.roleMap, (value, key) => {
      if (now - value.timestamp >= this.timeToLive) {
        delete this.roleMap[key];
      }
    });
  }
}

module.exports = RoleCache;
