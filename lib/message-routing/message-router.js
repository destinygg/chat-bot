const _ = require('lodash');

class MessageRouter {
  constructor(config, services) {
    this.logger = services.logger;
    this.chatCache = services.chatCache;
    this.punishmentCache = services.punishmentCache;
    this.punishmentStream = services.punishmentStream;
    this.matchThreshold = config.matchThreshold || 0.80;
  }

  routeIncomingMessages(newMessage) {
    const { user } = newMessage;
    const messageContent = newMessage.message;

    const matchPercents = this.chatCache.diffNewMessageForUser(user, messageContent);
    if (!_.every(matchPercents, matchPercent => matchPercent < this.matchThreshold)) {
      const duration = this.mute(user);
      return Promise.resolve({ user, punishment: 'MUTE', duration });
    }
    this.chatCache.addMessageToCache(user, messageContent);
    return Promise.resolve(false);
  }

  mute(user) {
    const duration = this.punishmentCache.getAndAddMuteDuration(user);
    this.punishmentStream.write({ user, duration });
    this.logger.info(`Muting ${user} for ${duration}`);
    return duration;
  }
}

module.exports = MessageRouter;
