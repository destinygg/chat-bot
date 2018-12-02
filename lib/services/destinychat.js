const EventEmitter = require('events');
const WebSocket = require('ws');
const _ = require('lodash');

const {
  parseCommand, parseMessage, parseWhisper,
  formatMessage, formatMute, formatWhisper,
  formatUnmute, formatBan, formatUnban,
} = require('../chat-utils/parse-commands-from-chat');

class DestinyChat extends EventEmitter {
  constructor(config, services) {
    super();
    this.logger = services.logger;
    this.url = config.url;
    this.cookieToken = config.cookieToken;
    this.botNick = config.botNick;
    this.flipFlop = false;
  }

  connect() {
    this.ws = new WebSocket(this.url, {
      headers:
        { Cookie: `authtoken=${this.cookieToken}` },
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
    console.log(event.data)
    const isMessage = _.startsWith(event.data, 'MSG');
    const isWhisper = _.startsWith(event.data, 'PRIVMSG');
    if (isWhisper || isMessage) {
      const parsedMessage = isWhisper ? parseWhisper(event.data) : parseMessage(event.data);
      console.log(parsedMessage);
      if (parsedMessage.user === this.botNick) {
        return;
      }

      if (isMessage) this.emit('message', parsedMessage);

      if (_.startsWith(parsedMessage.message, '!')) {
        this.emit('command', { parsedMessage, parsedCommand: parseCommand(parsedMessage.message), isWhisper });
      }
    }
  }


  sendMessage(message) {
    console.log(this)
    this.flipFlop = !this.flipFlop;
    // there's a zero width space in the first part of the
    // Terinary operator
    this.ws.send(formatMessage(`${this.flipFlop ? '​' : ''}${message}`));
  }

  sendWhisper(user, message) {
    this.ws.send(formatWhisper(user, message));
  }

  sendMute(punished) {
    this.ws.send(formatMute(punished.user, punished.duration));
  }

  sendUnmute(punished) {
    this.ws.send(formatUnmute(punished.user));
  }

  sendBan(punished) {
    this.ws.send(formatBan(punished.user, punished.duration, punished.ipban,
      punished.isPermanent, punished.reason));
  }

  sendUnban(punished) {
    this.ws.send(formatUnban(punished.user));
  }

  sendMultiLine(message) {
    message.forEach((newLineMessage) => {
      if (!_.isEmpty(newLineMessage)) {
        this.ws.send(formatMessage(newLineMessage));
      }
    });
  }

  handleError(event) {
    this.emit('error', event);
  }
}

module.exports = DestinyChat;
