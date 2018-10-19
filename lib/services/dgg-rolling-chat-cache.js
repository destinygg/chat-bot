const _ = require('lodash');
const moment = require('moment');
const similarity = require('../chat-utils/string-similarity');
// Uses Levenshtein distance to calculate the edit distance,
// and then a simple formula to get the change in %


class ChatCache {
  constructor(config) {
    this.messsagesToKeepPerUser = config.messsagesToKeepPerUser || 2;
    this.maxMessagesInList = config.maxMessagesInList || 2000;
    this.timeToLive = config.timeToLiveSeconds || 1800;
    this.tombStoneInterval = config.tomeStoneIntervalMilliseconds || 120000;

    this.viewerMap = {};
    this.runningMessageList = [];
    this.tombStoneMap = {};
    this.startTombStoneInterval();
  }

  startTombStoneInterval() {
    setInterval(() => {
      this.tombStoneCleanup();
    }, this.tombStoneInterval);
  }

  tombStoneCleanup() {
    if (_.isEmpty(this.tombStoneMap)) {
      return;
    }
    const now = moment().unix();
    _.forIn(this.tombStoneMap, (value, key) => {
      if ((now - value) >= this.timeToLive) {
        delete this.tombStoneMap[key];
        delete this.viewerMap[key];
      }
    });
  }

  addMessageToCache(user, message) {
    this.addMessageToViewerMap(user, message);
    this.addMessageToRunningList(user, message);
  }

  addMessageToViewerMap(user, message) {
    if (_.has(this.viewerMap, user)) {
      const viewerMessages = this.viewerMap[user];
      if (viewerMessages.length === this.messsagesToKeepPerUser) {
        viewerMessages.shift();
      }
      viewerMessages.push(message);
      this.tombStoneMap[user] = moment().unix();
      return;
    }
    this.viewerMap[user] = [message];
    this.tombStoneMap[user] = moment().unix();
  }

  addMessageToRunningList(user, message) {
    if (this.runningMessageList.length >= this.maxMessagesInList) {
      this.runningMessageList.shift();
    }

    this.runningMessageList.push({ user, message });
  }

  // Matcher is one of string or regex object


  diffNewMessageForUser(user, newMessage) {
    if (_.has(this.viewerMap, user)) {
      const viewerMessages = this.viewerMap[user];
      return viewerMessages.map(viewerMessage => similarity(
        viewerMessage.trim().toLowerCase(),
        newMessage.trim().toLowerCase(),
      ));
    }
    return 0;
  }
}

module.exports = ChatCache;
