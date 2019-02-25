const _ = require('lodash');
const EventEmitter = require('events');

class MessageRelay extends EventEmitter {
  constructor() {
    super();
    this.listeners = {};
  }

  sendOutputMessage(message) {
    this.emit('output', message);
  }

  startListenerForChatMessages(listenerKey) {
    if (_.has(this.listeners, listenerKey)) {
      return false;
    }

    this.listeners[listenerKey] = new EventEmitter();
    return this.listeners[listenerKey];
  }

  relayMessageToListeners(message) {
    if (_.keys(this.listeners).length === 0) {
      return;
    }

    _.forEach(this.listeners, (listener) => {
      listener.emit('message', message);
    });
  }

  stopRelay(listenerKey) {
    if (!_.has(this.listeners, listenerKey)) {
      return;
    }

    this.listeners[listenerKey].removeAllListeners();
    delete this.listeners[listenerKey];
  }
}

module.exports = MessageRelay;
