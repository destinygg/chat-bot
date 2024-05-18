const _ = require('lodash');
const moment = require('moment');

const { makeMute, makeBan } = require('../chat-utils/punishment-helpers');
const { isMessageNuked } = require('../services/spam-detection');
const {
  PRIVILEGED_USER_ROLES,
  PROTECTED_USER_LIST,
} = require('../chat-utils/privileged-user-list');
const { METRIC_NAMES } = require('../services/metrics/metric-names');
const { getReporter } = require('../services/metrics/metrics-reporter');
const formatDuration = require('../chat-utils/format-duration');

class MessageRouter {
  constructor(services) {
    this.logger = services.logger;
    this.chatCache = services.chatCache;
    this.punishmentCache = services.punishmentCache;
    this.punishmentStream = services.punishmentStream;
    this.spamDetection = services.spamDetection;
    this.roleCache = services.roleCache;
    this.messageRelay = services.messageRelay;
  }

  routeIncomingMessages(newMessage) {
    const { user, roles } = newMessage;
    const messageContent = newMessage.message;
    getReporter().incrementCounter(METRIC_NAMES.MESSAGE_RATE, 1);
    // No api to get roles, we gotta STORE IT
    this.messageRelay.relayMessageToListeners('msg', newMessage);

    this.roleCache.addUserRoles(user, roles);

    if (_.some(roles, (role) => PRIVILEGED_USER_ROLES[role] || PROTECTED_USER_LIST[role])) {
      this.chatCache.addMessageToRunningList(user, messageContent);
      return;
    }

    const nukedPhrases = this.punishmentCache.getNukedPhrases();

    const nukeResult = isMessageNuked(nukedPhrases, messageContent);
    if (nukeResult.duration !== 0) {
      this.punishmentCache.addUserToAegisCache(user, nukeResult.duration, nukeResult.phrase);

      const punishedEvent = nukeResult.isMegaNuke
        ? makeBan(
            user,
            nukeResult.duration,
            true,
            false,
            `${user}
       BANNED for ${formatDuration(
         moment.duration(nukeResult.duration, 'seconds'),
       )} for using a recently MEGA NUKED phrase (${nukeResult.phrase}).`,
          )
        : makeMute(
            user,
            nukeResult.duration,
            `${user}
       muted for ${formatDuration(
         moment.duration(nukeResult.duration, 'seconds'),
       )} for using a recently nuked phrase (${nukeResult.phrase}).`,
          );

      this.punishmentStream.write(punishedEvent);
      this.chatCache.addMessageToRunningList(user, messageContent);
      return;
    }

    const matchPercents = this.chatCache.diffNewMessageForUser(user, messageContent);

    const spamDetectionList = [
      this.spamDetection.asciiSpamCheck(messageContent),
      this.spamDetection.isSimilarityAboveThreshold(matchPercents),
      this.spamDetection.checkListOfMessagesForSpam(
        messageContent,
        this.chatCache.runningMessageList,
      ),
      this.spamDetection.uniqueWordsCheck(messageContent),
      this.spamDetection.longRepeatedPhrase(messageContent),
      this.spamDetection.checkListOfRecentUrlsForSpam(
        messageContent,
        this.chatCache.getViewerUrlList(user),
        this.chatCache.messageUrlSpamUser,
      ),
    ];

    if (_.some(spamDetectionList)) {
      const reasonIndex = spamDetectionList.findIndex((s) => s);

      const reasons = {
        0: 'Too many non-ascii symbols.',
        1: 'Too similar to your own past text.',
        2: 'Too similar to other chatters past text.',
        3: 'Spamming similar phrases too much.',
        4: 'Spamming similar phrases too much.',
        5: 'Spamming the same link too much.',
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
