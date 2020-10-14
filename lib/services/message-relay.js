const _ = require('lodash');
const { EventEmitter } = require('events');

class MessageRelay extends EventEmitter {
  constructor() {
    super();
    /** @type {Object<string, EventEmitter>} */
    this.chatListeners = {};
  }

  /**
   * @param {string} message
   */
  sendOutputMessage(message) {
    this.emit('output', message);
  }

  /**
   * @param {string} listenerKey
   */
  startListenerForChatMessages(listenerKey) {
    if (_.has(this.chatListeners, listenerKey)) {
      return false;
    }

    this.chatListeners[listenerKey] = new EventEmitter();
    return this.chatListeners[listenerKey];
  }

  /**
   * @param {string} message
   */
  relayMessageToListeners(message) {
    if (_.keys(this.chatListeners).length === 0) {
      return;
    }

    _.forEach(this.chatListeners, (listener) => {
      listener.emit('message', message);
    });
  }

  /**
   * @param {string} listenerKey
   */
  stopRelay(listenerKey) {
    if (!_.has(this.chatListeners, listenerKey)) {
      return;
    }

    this.chatListeners[listenerKey].removeAllListeners();
    delete this.chatListeners[listenerKey];
  }
}

module.exports = MessageRelay;
