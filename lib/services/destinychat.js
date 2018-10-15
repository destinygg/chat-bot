const EventEmitter = require('events');
const WebSocket = require('ws');
const _ = require('lodash');

const { parseCommand, parseMessage, formatMessage } = require('../chat-utils/parse-commands-from-chat');

class DestinyChat extends EventEmitter {
  constructor(config, services) {
    super();
    this.logger = services.logger;
    this.url = config.url;
  }

  connect() {
    this.ws = new WebSocket(this.url, {
      headers:
        { Cookie: '' },
    });
    this.ws.onopen = this.onOpen.bind(this);
    this.ws.onclose = this.onClose.bind(this);
    this.ws.onmessage = this.parseMessages.bind(this);
    this.ws.onerror = this.handleError.bind(this);
  }

  onOpen(e) {
    this.emit('open', e);
  }

  onClose(e) {
    this.emit('closed', e);
  }

  // We only care about messages from users, toss everything else.
  // If it looks like a command, emit a command event so we can react.
  // Otherwise just emit it as a message for listeners of message events.
  parseMessages(event) {
    if (_.startsWith(event.data, 'MSG')) {
      const parsedMessage = parseMessage(event.data);
      this.emit('message', parsedMessage);

      if (_.startsWith(parsedMessage.message, '!')) {
        this.emit('command', { parsedMessage, parsedCommand: parseCommand(parsedMessage.message) });
      }
    }
  }

  sendMessage(message) {
    this.ws.send(formatMessage(message));
  }

  handleError(event) {
    this.emit('error', event);
  }
}

module.exports = DestinyChat;
