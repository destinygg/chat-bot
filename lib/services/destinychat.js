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
  formatAddPhrase,
  formatRemovePhrase,
  formatPoll,
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

  parseMessages(event) {
    const isMessage = _.startsWith(event.data, 'MSG');
    const isWhisper = _.startsWith(event.data, 'PRIVMSG ');
    if (isWhisper || isMessage) {
      const parsedMessage = isWhisper ? parseWhisper(event.data) : parseMessage(event.data);
      if (parsedMessage.user === this.botNick) {
        return;
      }

      if (isMessage) this.emit('msg', parsedMessage);

      if (_.startsWith(parsedMessage.message, '!')) {
        this.emit('command', {
          parsedMessage,
          parsedCommand: parseCommand(parsedMessage.message),
          isWhisper,
        });
      }
    }

    if (_.startsWith(event.data, 'ERR')) {
      this.emit('err', event.data.replace('ERR ', ''));
    }
    if (_.startsWith(event.data, 'POLLSTART')) {
      this.emit('pollstart', event.data.replace('POLLSTART ', ''));
    }
    if (_.startsWith(event.data, 'POLLSTOP')) {
      this.emit('pollstop', event.data.replace('POLLSTOP ', ''));
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

  sendPoll(weighted, time, question, options) {
    this.ws.send(formatPoll(weighted, time, question, options));
  }

  sendMultiLine(message) {
    message.forEach((newLineMessage) => {
      if (!_.isEmpty(newLineMessage)) {
        this.ws.send(formatMessage(newLineMessage));
      }
    });
  }

  sendAddPhrase(phrase) {
    this.ws.send(formatAddPhrase(phrase));
  }

  sendRemovePhrase(phrase) {
    this.ws.send(formatRemovePhrase(phrase));
  }

  handleError(event) {
    this.emit('error', event);
  }
}

module.exports = DestinyChat;
