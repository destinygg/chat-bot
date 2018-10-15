const fastLevenshtein = require('fast-levenshtein');
const _ = require('lodash');
const moment = require('moment');
// Uses Levenshtein distance to calculate the edit distance,
// and then a simple formula to get the change in %
function similarity(oldMessage, newMessage) {
  let longerMessage = oldMessage;
  let shorterMessage = newMessage;
  if (oldMessage.length < newMessage.length) {
    longerMessage = newMessage;
    shorterMessage = oldMessage;
  }
  const longerLength = longerMessage.length;
  if (longerLength === 0) {
    return 1.0;
  }
  return (longerLength - fastLevenshtein.get(longerMessage, shorterMessage))
    / parseFloat(longerLength);
}

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
  getUsersWithMatchedMessage(matcher, totalToSearchFor) {
    let matchExpression = null;
    const listLength = this.runningMessageList.length;
    const matchedUsersList = [];
    if (typeof matcher === 'object') {
      matchExpression = matcher.test.bind(matcher);
    } else {
      // Prepare the function so it can be called with just the string to search for.
      matchExpression = _.curry(_.includes)(_, matcher, 0, false);
    }
    // Start at the end of the array, cap the stop value at 0.
    const stopValue = Math.max(listLength - 1 - totalToSearchFor, 0);
    for (let i = listLength - 1; i >= stopValue; i -= 1) {
      if (matchExpression(this.runningMessageList[i].message.toLowerCase().trim())) {
        matchedUsersList.push(this.runningMessageList[i].user);
      }
    }

    if (matchedUsersList.length > 0) {
      return _.uniq(matchedUsersList);
    }
    return matchedUsersList;
  }

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
