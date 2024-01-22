const _ = require('lodash');
const moment = require('moment');
const similarity = require('../chat-utils/string-similarity');
// Uses Levenshtein distance to calculate the edit distance,
// and then a simple formula to get the change in %

class ChatCache {
  constructor(config, services) {
    this.logger = services.logger;
    this.messageMatching = services.messageMatching;
    this.messsagesToKeepPerUser = config.messsagesToKeepPerUser || 2;
    this.maxMessagesInList = config.maxMessagesInList || 2000;
    this.timeToLive = config.timeToLiveSeconds || 1800;
    this.tombStoneInterval = config.tomeStoneIntervalMilliseconds || 120000;
    this.rateLimitMaxMessages = config.rateLimitMaxMessages || 4;
    this.rateLimitSecondsToRefresh = config.rateLimitSecondsToRefresh || 3;
    this.viewerMessageMinimumLength = config.viewerMessageMinimumLength || 20;
    this.messageUrlSpamSeconds = config.messageUrlSpamSeconds || 600;
    this.messageUrlSpamUser = config.messageUrlSpamUser || null;
    this.viewerMap = {};
    this.viewerUrlMap = {};
    this.rateLimitMap = {};
    this.runningMessageList = [];
    this.tombStoneMap = {};
    this.startTombStoneInterval();

    this.logger.info(`Config loaded for Chat Cache: ${JSON.stringify(config)}`);
  }

  startTombStoneInterval() {
    setInterval(() => {
      this.tombStoneCleanup();
    }, this.tombStoneInterval);
  }

  tombStoneCleanup() {
    const now = moment().unix();

    _.forIn(this.viewerUrlMap, (urls, user) => {
      const filteredOldUrls = urls.filter((link) => now - link.exp < this.messageUrlSpamSeconds);
      if (filteredOldUrls.length === 0) {
        delete this.viewerUrlMap[user];
      } else {
        this.viewerUrlMap[user] = filteredOldUrls;
      }
    });

    if (_.isEmpty(this.tombStoneMap)) return;
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
    this.addMessageToViewerUrlMap(user, message);
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

  addMessageToViewerUrlMap(user, message) {
    if (
      this.messageUrlSpamUser &&
      !this.messageMatching.mentionsUser(message, this.messageUrlSpamUser)
    ) {
      return;
    }
    this.messageMatching.getLinks(message).forEach((link) => {
      this.logger.info('Cached viewer url:', { user, message });
      if (!_.has(this.viewerUrlMap, user)) this.viewerUrlMap[user] = [];
      this.viewerUrlMap[user].push({
        url: link.hostname + link.pathname,
        exp: moment().unix(),
      });
    });
  }

  getViewerUrlList(user) {
    if (!user || !_.has(this.viewerUrlMap, user)) return [];
    const now = moment().unix();
    const filteredOldUrls = this.viewerUrlMap[user]
      .filter((link) => now - link.exp < this.messageUrlSpamSeconds)
      .map((link) => link.url);
    return filteredOldUrls;
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
