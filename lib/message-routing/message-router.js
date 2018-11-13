const _ = require('lodash');
const { makeMute, makeBan } = require('../chat-utils/punishment-helpers');
const { isMessageNuked } = require('../services/spam-detection');
const { PRIVILEGED_USER_ROLES, PROTECTED_USER_LIST } = require('../chat-utils/privileged-user-list');

class MessageRouter {
  constructor(config, services) {
    this.logger = services.logger;
    this.chatCache = services.chatCache;
    this.punishmentCache = services.punishmentCache;
    this.punishmentStream = services.punishmentStream;
    this.spamDetection = services.spamDetection;
    this.roleCache = services.roleCache;
  }

  routeIncomingMessages(newMessage) {
    const { user, roles } = newMessage;
    const messageContent = newMessage.message;
    // No api to get roles, we gotta STORE IT
    this.roleCache.addUserRoles(user, roles);

    if (_.some(roles, role => PRIVILEGED_USER_ROLES[role] || PROTECTED_USER_LIST[role])) {
      this.chatCache.addMessageToRunningList(user, messageContent);
      return;
    }

    const bannedPhrase = this.spamDetection.checkAgainstBannedPhrases(messageContent);

    if (bannedPhrase !== false) {
      if (bannedPhrase.type === 'mute') {
        this.punishmentStream.write(makeMute(user, bannedPhrase.duration, `${user} muted for using banned phrase(${bannedPhrase.text}).`, true));
      } else if (bannedPhrase.type === 'ban') {
        this.punishmentStream.write(makeBan(user, bannedPhrase.duration, null, null, `${user} banned for using banned phrase(${bannedPhrase.text}).`, true));
      }
      return;
    }

    const nukedPhrases = this.punishmentCache.getNukedPhrases();

    const nukeResult = isMessageNuked(nukedPhrases, messageContent);
    if (nukeResult.duration !== 0) {
      this.punishmentStream.write(makeMute(user, nukeResult.duration, `${user} muted for ${nukeResult.duration} seconds for using a recently nuked phrase (${nukeResult.phrase}).`));
      return;
    }

    const matchPercents = this.chatCache.diffNewMessageForUser(user, messageContent);

    const spamDetectionList = [
      this.spamDetection.asciiSpamCheck(messageContent),
      this.spamDetection.isSimilarityAboveThreshold(matchPercents),
      this.spamDetection.checkListOfMessagesForSpam(messageContent,
        this.chatCache.runningMessageList),
      this.spamDetection.uniqueWordsCheck(messageContent),
    ];

    if (_.some(spamDetectionList)) {
      const reasonIndex = spamDetectionList.findIndex(s => s);

      const reasons = {
        0: 'Too many non-ascii symbols.',
        1: 'Too similar to your own past text.',
        2: 'Too similar to other chatters past text.',
        3: 'Spamming similar phrases too much.',
      };

      this.logger.info({ AUTO_MUTE_REASON: reasons[reasonIndex] }, newMessage);
      this.mute(user, reasons[reasonIndex]);
      this.chatCache.addMessageToRunningList(user, messageContent);
    } else {
      this.chatCache.addMessageToCache(user, messageContent);
      if (this.chatCache.isPastRateLimit(user)) {
        this.logger.info('Rate limited message: ');
        this.logger.info(newMessage);
        this.mute(user, 'Triggered throttle.');
      }
    }
  }

  mute(user, reason) {
    this.punishmentStream.write(makeMute(user, null, reason));
  }
}

module.exports = MessageRouter;
