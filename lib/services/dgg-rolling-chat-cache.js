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
    this.rateLimitMaxMessages = config.rateLimitMaxMessages || 4;
    this.rateLimitSecondsToRefresh = config.rateLimitSecondsToRefresh || 3;
    this.viewerMessageMinimumLength = config.viewerMessageMinimumLength || 20;
    this.viewerMap = {};
    this.rateLimitMap = {};
    this.runningMessageList = [];
    this.tombStoneMap = {};
    this.startTombStoneInterval();
  }

  getCachedUsers() {
    return Object.keys(this.rateLimitMap);
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
      if (now - value >= this.timeToLive) {
        delete this.tombStoneMap[key];
        delete this.viewerMap[key];
        delete this.rateLimitMap[key];
      }
    });
  }

  addMessageToCache(user, message) {
    if (message.length >= this.viewerMessageMinimumLength) {
      this.addMessageToViewerMap(user, message);
    }
    this.addMessageToRunningList(user, message);
    this.addMessageToRateLimitMap(user);
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

  isPastRateLimit(user) {
    const lastMessages = this.rateLimitMap[user];
    if (lastMessages.length === this.rateLimitMaxMessages) {
      return (
        lastMessages[lastMessages.length - 1] - lastMessages[0] <= this.rateLimitSecondsToRefresh
      );
    }
    return false;
  }

  addMessageToRateLimitMap(user) {
    if (this.rateLimitMap[user] === undefined) {
      this.rateLimitMap[user] = [moment().unix()];
    } else if (this.rateLimitMap[user].length === this.rateLimitMaxMessages) {
      this.rateLimitMap[user].shift();
      this.rateLimitMap[user].push(moment().unix());
    } else {
      this.rateLimitMap[user].push(moment().unix());
    }
  }

  addMessageToRunningList(user, message) {
    if (this.runningMessageList.length >= this.maxMessagesInList) {
      this.runningMessageList.shift();
    }

    this.runningMessageList.push({ user, message, timeStamp: moment().unix() });
  }

  // Matcher is one of string or regex object

  diffNewMessageForUser(user, newMessage) {
    if (_.has(this.viewerMap, user)) {
      const viewerMessages = this.viewerMap[user];
      return viewerMessages.map((viewerMessage) =>
        similarity(viewerMessage.trim().toLowerCase(), newMessage.trim().toLowerCase()),
      );
    }
    return 0;
  }
}

module.exports = ChatCache;
