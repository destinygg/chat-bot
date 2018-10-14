const _ = require('lodash');

class MessageHandler {
  constructor(config, services) {
    this.logger = services.logger;
    this.chatCache = services.chatCache;
    this.matchThreshold = config.matchThreshold || 0.80;
  }

  handleIncomingMessage(newMessage) {
    const { user } = newMessage;
    const messageContent = newMessage.message;

    const matchPercents = this.chatCache.diffNewMessageForUser(user, messageContent);
    if (!_.every(matchPercents, matchPercent => matchPercent < this.matchThreshold)) {
      this.mute(user);
    } else {
      this.chatCache.addMessageToCache(user, messageContent);
      this.logger.info(this.chatCache.viewerMap);
    }
  }

  mute(user) {
    // TODO create some kind of muting/punishment service
    this.logger.info(`Muting ${user}`);
  }
}

module.exports = MessageHandler;
