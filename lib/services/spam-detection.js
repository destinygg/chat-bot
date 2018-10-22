const _ = require('lodash');
const similarity = require('../chat-utils/string-similarity');

// This is basically all punctuation that exists in ascii or otherwise.

class SpamDetection {
  constructor(config) {
    this.asciiArtThreshold = config.asciiArtThreshold || 20;
    this.matchPercentPerUserThreshold = config.matchPercentPerUserThreshold || 0.90;
    this.messagesToSearch = config.messagesToSearch || 75;
    this.nukeDepth = config.nukeDepth || 500;
    this.bannedPhrases = new Set();
    this.minimumStringSearchLength = config.minimumStringSearchLength || 100;
    this.uniqueWordsThreshold = config.uniqueWordsThreshold || 0.45;
  }

  // Checks whether there's a large number of non ascii characters
  // Or a large number of ascii punctuation symbols.
  asciiSpamCheck(message) {
    return (_.get(message.match(/[^\x20-\x7F]/g), 'length', 0) > this.asciiArtThreshold)
      || _.get(message.match(/[\x21-\x2F\x3A-\x40]/g), 'length', 0) > this.asciiArtThreshold * 3;
  }

  addBannedPhrase(phrase) {
    this.bannedPhrases.add(phrase);
  }

  removeBannedPhrase(phrase) {
    this.bannedPhrases.delete(phrase);
  }

  uniqueWordsCheck(message) {
    if (message.length > this.minimumStringSearchLength) {
      const wordsList = _.words(message);
      const totalWords = wordsList.length;
      const uniqueWords = _.uniq(wordsList).length;
      if (totalWords === 0) {
        return false;
      }

      return (uniqueWords / totalWords) <= this.uniqueWordsThreshold;
    }
    return false;
  }

  checkAgainstBannedPhrases(message) {
    let isBanned = false;
    this.bannedPhrases.forEach((phrase) => {
      if (_.includes(message.toLowerCase().trim(), phrase.toLowerCase().trim())) {
        isBanned = true;
        return false;
      }
      return true;
    });
    return isBanned;
  }

  // Checks a list of match percents to see if it meets the threshold.
  isSimilarityAboveThreshold(matchPercents) {
    return (_.some(matchPercents,
      matchPercent => matchPercent > this.matchPercentPerUserThreshold));
  }

  // Checks a list of messages to see if they contain similar spammy looking phrases.
  checkListOfMessagesForSpam(newMessage, messageList) {
    if (newMessage.length < this.minimumStringSearchLength) {
      return false;
    }
    const messagesToCheck = _.takeRight(messageList, this.messagesToSearch);
    const matchPercents = messagesToCheck.map(viewerMessage => similarity(
      viewerMessage.message.trim().toLowerCase(),
      newMessage.trim().toLowerCase(),
    ));

    return this.isSimilarityAboveThreshold(matchPercents);
  }

  getUsersWithMatchedMessage(matcher, messageList) {
    let matchExpression = null;
    const listLength = messageList.length;
    const matchedUsersList = [];
    if (typeof matcher === 'object') {
      matchExpression = matcher.test.bind(matcher);
    } else {
      // Prepare the function so it can be called with just the string to search for.
      matchExpression = _.curry(_.includes)(_, matcher, 0, false);
    }
    // Start at the end of the array, cap the stop value at 0.
    const stopValue = Math.max(listLength - 1 - this.nukeDepth, 0);
    for (let i = listLength - 1; i >= stopValue; i -= 1) {
      if (matchExpression(messageList[i].message.toLowerCase().trim())) {
        matchedUsersList.push(messageList[i].user);
      }
    }

    if (matchedUsersList.length > 0) {
      return _.uniq(matchedUsersList);
    }
    return matchedUsersList;
  }
}

module.exports = SpamDetection;
