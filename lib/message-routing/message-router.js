const _ = require('lodash');
const { makeMute } = require('../chat-utils/punishment-helpers');

class MessageRouter {
  constructor(config, services) {
    this.logger = services.logger;
    this.chatCache = services.chatCache;
    this.punishmentCache = services.punishmentCache;
    this.punishmentStream = services.punishmentStream;
    this.spamDetection = services.spamDetection;
  }

  routeIncomingMessages(newMessage) {
    const { user } = newMessage;
    const messageContent = newMessage.message;
    const matchPercents = this.chatCache.diffNewMessageForUser(user, messageContent);
    const spamDetectionList = [
      this.spamDetection.asciiSpamCheck(messageContent),
      this.spamDetection.checkListOfMessagesForSpam(messageContent,
        this.chatCache.runningMessageList),
      this.spamDetection.isSimilarityAboveThreshold(matchPercents),
    ];

    if (_.some(spamDetectionList)) {
      this.logger.info(`ascii: ${spamDetectionList[0]}, other user similarity: 
        ${spamDetectionList[1]}, same user spamming: ${spamDetectionList[2]}`);
      this.logger.info(newMessage);
      this.mute(user);
      this.chatCache.addMessageToRunningList(user, messageContent);
    } else {
      this.chatCache.addMessageToCache(user, messageContent);
    }
  }

  mute(user) {
    this.punishmentStream.write(makeMute(user, null, null));
  }
}

module.exports = MessageRouter;
