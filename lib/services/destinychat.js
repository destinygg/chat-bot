const EventEmitter = require('events');
const WebSocket = require('ws');
const _ = require('lodash');

const {
  parseCommand,
  parseMessage,
  parseWhisper,
  formatMessage,
  formatMute,
  formatWhisper,
  formatUnmute,
  formatBan,
  formatUnban,
} = require('../chat-utils/parse-commands-from-chat');

class DestinyChat extends EventEmitter {
  constructor(config, services) {
    super();
    this.logger = services.logger;
    this.url = config.url;
    this.origin = config.origin;
    this.cookieToken = config.cookieToken;
    this.botNick = config.botNick;
  }

  connect() {
    this.ws = new WebSocket(this.url, {
      origin: this.origin,
      headers: { Cookie: `authtoken=${this.cookieToken}` },
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
    const isMessage = _.startsWith(event.data, 'MSG');
    const isWhisper = _.startsWith(event.data, 'PRIVMSG ');
    if (isWhisper || isMessage) {
      const parsedMessage = isWhisper ? parseWhisper(event.data) : parseMessage(event.data);
      if (parsedMessage.user === this.botNick) {
        return;
      }

      if (isMessage) this.emit('message', parsedMessage);

      if (_.startsWith(parsedMessage.message, '!')) {
        this.emit('command', {
          parsedMessage,
          parsedCommand: parseCommand(parsedMessage.message),
          isWhisper,
        });
      }
    }
  }

  sendMessage(message) {
    this.ws.send(formatMessage(message));
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
    this.ws.send(
      formatBan(
        punished.user,
        punished.duration,
        punished.ipban,
        punished.isPermanent,
        punished.reason,
      ),
    );
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
