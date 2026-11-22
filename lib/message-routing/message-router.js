const _ = require('lodash');
const moment = require('moment');

const { makeMute, makeBan } = require('../chat-utils/punishment-helpers');
const {
  PRIVILEGED_USER_ROLES,
  PROTECTED_USER_LIST,
  TRUSTED_USER_ROLE,
} = require('../chat-utils/privileged-user-list');
const { METRIC_NAMES } = require('../services/metrics/metric-names');
const { getReporter } = require('../services/metrics/metrics-reporter');
const formatDuration = require('../chat-utils/format-duration');
const normalizeUrl = require('../chat-utils/normalize-url');

function isTrustedUser(data) {
  const roles = data.roles || [];
  return roles.includes(TRUSTED_USER_ROLE);
}

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
    this.messageMatching = services.messageMatching;
    this.twitterApi = services.twitterApi;
    this.htmlMetadata = services.htmlMetadata;
    this.chatConnectedTo = config.chatConnectedTo;
  }

  routeIncomingMessages(newMessage) {
    const { user, id, roles } = newMessage;
    const messageContent = newMessage.message;
    getReporter().incrementCounter(METRIC_NAMES.MESSAGE_RATE, 1);
    // No api to get roles, we gotta STORE IT
    this.messageRelay.relayMessageToListeners('msg', newMessage);
    this.handleMuteLinks(newMessage);
    this.handleBreakingNews(newMessage);

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

  handleMuteLinks(data) {
    const state = this.moderationState.mutelinks;
    if (!state || state.mode === 'off') {
      return;
    }

    const message = data.message.trim().toLowerCase();
    const muteDuration = state.duration || 60;
    const formattedDuration = formatDuration(moment.duration(muteDuration, 'seconds'));

    if (state.mode === 'on') {
      if (!this.messageMatching.mentionsUser(message, state.mention)) return;
      if (!this.messageMatching.hasLink(message)) return;
      if (isTrustedUser(data)) return;

      this.punishmentStream.write(
        makeMute(
          data.user,
          muteDuration,
          `${data.user} muted for ${formattedDuration} for tagging ${state.mention} with a link.`,
        ),
      );
      return;
    }

    if (state.mode === 'all') {
      if (!this.messageMatching.hasLink(message)) return;
      if (isTrustedUser(data)) return;

      this.punishmentStream.write(
        makeMute(
          data.user,
          muteDuration,
          `${data.user} muted for ${formattedDuration} for posting a link while link muting is on.`,
        ),
      );
      return;
    }

    if (state.mode === 'repeat') {
      if (!this.messageMatching.hasLink(message)) return;
      if (isTrustedUser(data)) return;

      const links = this.messageMatching.getLinks(message);
      const recentUrls = this.chatCache.getRecentUrls();

      const hasRepeatedLink = links.some((link) => {
        const normalizedLink = normalizeUrl(link);
        this.logger.info('Testing URL in mutelinks repeat mode', { url: normalizedLink });
        return recentUrls.includes(normalizedLink);
      });

      if (hasRepeatedLink) {
        this.punishmentStream.write(
          makeMute(
            data.user,
            muteDuration,
            `${data.user} muted for ${formattedDuration} for posting a repeated link.`,
          ),
        );
      }
    }
  }

  handleBreakingNews(data) {
    const state = this.moderationState.breakingnews;
    if (!state || state.mode === 'off') {
      return;
    }

    const message = data.message.trim().toLowerCase();
    if (state.mode !== 'all' && !this.messageMatching.mentionsUser(message, state.mention)) {
      return;
    }
    if (!this.messageMatching.hasLink(message)) {
      return;
    }

    const maxAge = state.maxAge || 300;
    const formattedMaxAge = formatDuration(moment.duration(maxAge, 'seconds'));

    const makePunishment = (datetime) => {
      const diff = moment().diff(datetime);
      if (diff > maxAge * 1000) {
        const muteDuration = diff / 1000 - maxAge;
        const formattedDuration = formatDuration(moment.duration(muteDuration, 'seconds'));
        this.punishmentStream.write(
          makeMute(
            data.user,
            muteDuration,
            `${data.user} muted for ${formattedDuration} for posting a link older than ${formattedMaxAge} while breaking news mode is on.`,
          ),
        );
      }
    };

    this.messageMatching.getLinks(message).forEach((link) => {
      if (link.hostname === 'twitter.com') {
        return this.twitterApi
          .getTweetDatetimeFromMessage(message)
          .then((datetime) => {
            return makePunishment(datetime);
          })
          .catch(() => {
            /* relevant errors already logged */
          });
      }
      return this.htmlMetadata
        .getOpenGraphDate(link.href)
        .then((datetime) => {
          return makePunishment(datetime);
        })
        .catch((error) => {
          if (error.message === 'No date found') {
            this.logger.warn(
              `No date found for link (${link.href}) during breaking news mode, please create GitHub issue`,
            );
          } else {
            this.logger.error(error);
          }
        });
    });
  }
}

module.exports = MessageRouter;
