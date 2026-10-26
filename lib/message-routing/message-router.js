const _ = require('lodash');
const moment = require('moment');

const { makeMute, makeBan } = require('../chat-utils/punishment-helpers');
const {
  PRIVILEGED_USER_ROLES,
  PROTECTED_USER_LIST,
} = require('../chat-utils/privileged-user-list');
const { METRIC_NAMES } = require('../services/metrics/metric-names');
const { getReporter } = require('../services/metrics/metrics-reporter');
const formatDuration = require('../chat-utils/format-duration');

class MessageRouter {
  constructor(config, services) {
    this.logger = services.logger;
    this.chatCache = services.chatCache;
    this.punishmentCache = services.punishmentCache;
    this.punishmentStream = services.punishmentStream;
    this.spamDetection = services.spamDetection;
    this.roleCache = services.roleCache;
    this.messageRelay = services.messageRelay;
    this.moderationState = services.moderationState;
    this.chatConnectedTo = config.chatConnectedTo;
  }

  routeIncomingMessages(newMessage) {
    const { user, id, roles } = newMessage;
    const messageContent = newMessage.message;
    getReporter().incrementCounter(METRIC_NAMES.MESSAGE_RATE, 1);
    // No api to get roles, we gotta STORE IT
    this.messageRelay.relayMessageToListeners('msg', newMessage);

    this.roleCache.addUserRoles(user, roles);

    if (_.some(roles, (role) => PRIVILEGED_USER_ROLES[role] || PROTECTED_USER_LIST[role])) {
      this.chatCache.addMessageToRunningList(user, id, messageContent);
      return;
    }

    if (this.chatConnectedTo === 'twitch') {
      const bannedPhrase = this.spamDetection.checkAgainstBannedPhrases(messageContent);

      if (bannedPhrase !== false) {
        if (bannedPhrase.type === 'mute') {
          this.punishmentStream.write(
            makeMute(
              user,
              bannedPhrase.duration,
              `${user} muted for using banned phrase(${bannedPhrase.text}).`,
              true,
            ),
          );
        } else if (bannedPhrase.type === 'ban') {
          this.punishmentStream.write(
            makeBan(
              user,
              bannedPhrase.duration,
              null,
              null,
              `${user} banned for using banned phrase(${bannedPhrase.text}).`,
              true,
            ),
          );
        }
        this.chatCache.addMessageToRunningList(user, id, messageContent);
        return;
      }
    }

    const nukeResult = this.moderationState.matchNuke(messageContent);

    if (nukeResult !== null) {
      this.moderationState.addNukeVictims(nukeResult, [{ id, nick: user }]);

      const nukePhrase = nukeResult.regex ? `/${nukeResult.phrase}/` : nukeResult.phrase;
      const punishedEvent = nukeResult.mega
        ? makeBan(
            user,
            nukeResult.duration,
            true,
            false,
            `${user}
       BANNED for ${formatDuration(
         moment.duration(nukeResult.duration, 'seconds'),
       )} for using a recently MEGA NUKED phrase (${nukePhrase}).`,
          )
        : makeMute(
            user,
            nukeResult.duration,
            `${user}
       muted for ${formatDuration(
         moment.duration(nukeResult.duration, 'seconds'),
       )} for using a recently nuked phrase (${nukePhrase}).`,
          );

      this.punishmentStream.write(punishedEvent);
      this.chatCache.addMessageToRunningList(user, id, messageContent);
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
      this.chatCache.addMessageToRunningList(user, id, messageContent);
    } else {
      this.chatCache.addMessageToCache(user, id, messageContent);
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
