const _ = require('lodash');
const { makeMute, makeBan } = require('../chat-utils/punishment-helpers');
const priviledgedUserRoles = require('../chat-utils/privledged-user-list');

class MessageRouter {
  constructor(config, services) {
    this.logger = services.logger;
    this.chatCache = services.chatCache;
    this.punishmentCache = services.punishmentCache;
    this.punishmentStream = services.punishmentStream;
    this.spamDetection = services.spamDetection;
  }

  routeIncomingMessages(newMessage) {
    const { user, roles } = newMessage;
    const messageContent = newMessage.message;

    if (_.some(roles, role => priviledgedUserRoles[role])) {
      this.chatCache.addMessageToRunningList(user, messageContent);
      return;
    }

    const bannedPhrase = this.spamDetection.checkAgainstBannedPhrases(messageContent);

    if (bannedPhrase !== false) {
      if (bannedPhrase.type === 'mute') {
        this.punishmentStream.write(makeMute(user, bannedPhrase.duration, `${user} muted for using banned phrase.`));
      } else if (bannedPhrase.type === 'ban') {
        this.punishmentStream.write(makeBan(user, bannedPhrase.duration, null, null, `${user} banned for using banned phrase.`));
      }
      return;
    }

    const matchPercents = this.chatCache.diffNewMessageForUser(user, messageContent);

    const spamDetectionList = [
      this.spamDetection.asciiSpamCheck(messageContent),
      this.spamDetection.checkListOfMessagesForSpam(messageContent,
        this.chatCache.runningMessageList),
      this.spamDetection.isSimilarityAboveThreshold(matchPercents),
      this.spamDetection.uniqueWordsCheck(messageContent)
    ];

    if (_.some(spamDetectionList)) {
      this.logger.info(`
        ascii: ${spamDetectionList[0]}, 
        other user similarity: ${spamDetectionList[1]}, 
        same user spamming: ${spamDetectionList[2]},
        unique words: ${spamDetectionList[3]}`);

      this.logger.info(newMessage);
      this.mute(user);
      this.chatCache.addMessageToRunningList(user, messageContent);
    } else {
      this.chatCache.addMessageToCache(user, messageContent);
      if (this.chatCache.isPastRateLimit(user)) {
        this.logger.info('Rate limited message: ');
        this.logger.info(newMessage);
        this.mute(user);
      }
    }
  }

  mute(user) {
    this.punishmentStream.write(makeMute(user, null, null));
  }
}

module.exports = MessageRouter;
