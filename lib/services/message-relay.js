const _ = require('lodash');
const { EventEmitter } = require('events');

class MessageRelay extends EventEmitter {
  constructor() {
    super();
    this.listeners = Object.create(null);
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
    if (_.has(this.listeners, listenerKey)) {
      return false;
    }

    this.listeners[listenerKey] = new EventEmitter();
    return this.listeners[listenerKey];
  }

  /**
   * @param {string} message
   */
  relayMessageToListeners(message) {
    if (_.keys(this.listeners).length === 0) {
      return;
    }

    _.forEach(this.listeners, (listener) => {
      listener.emit('message', message);
    });
  }

  /**
   * @param {string} listenerKey
   */
  stopRelay(listenerKey) {
    if (!_.has(this.listeners, listenerKey)) {
      return;
    }

    this.listeners[listenerKey].removeAllListeners();
    delete this.listeners[listenerKey];
  }
}

module.exports = MessageRelay;
