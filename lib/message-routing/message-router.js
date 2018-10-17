const _ = require('lodash');
const { makeMute } = require('../chat-utils/punishment-helpers');

class MessageRouter {
  constructor(config, services) {
    this.logger = services.logger;
    this.chatCache = services.chatCache;
    this.punishmentCache = services.punishmentCache;
    this.punishmentStream = services.punishmentStream;
    this.matchThreshold = config.matchThreshold || 0.90;
  }

  routeIncomingMessages(newMessage) {
    const { user } = newMessage;
    const messageContent = newMessage.message;
    const matchPercents = this.chatCache.diffNewMessageForUser(user, messageContent);
    if (!_.every(matchPercents, matchPercent => matchPercent < this.matchThreshold)) {
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
