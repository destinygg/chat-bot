const EventEmitter = require('events');
const WebSocket = require('ws');

class DestinyLive extends EventEmitter {
  constructor(config, services) {
    super();
    this.logger = services.logger;
    this.commandRegistry = services.commandRegistry;
    this.url = config.url;
    this.origin = config.origin;
    this.cache = {};
  }

  connect() {
    this.ws = new WebSocket(this.url, {
      origin: this.origin,
    });
    this.ws.onopen = this.onOpen.bind(this);
    this.ws.onclose = this.onClose.bind(this);
    this.ws.onmessage = this.parseMessages.bind(this);
    this.ws.onerror = this.handleError.bind(this);
  }

  onOpen() {
    this.logger.info('Destiny Live socket opened.');
  }

  onClose() {
    this.logger.info('Destiny Live socket closed. Attempting to reconnect....');
    setTimeout(() => {
      this.connect();
    }, 5000);
  }

  parseMessages(message) {
    try {
      const event = JSON.parse(message.data);

      if (event.type === 'dggApi:streamInfo' && this.cache[event.type]) {
        const wasLive = this.cache[event.type].some((s) => s?.live);
        const isLive = event.data.some((s) => s?.live);
        if (wasLive && !isLive) {
          this.emit('offline');
        } else if (!wasLive && isLive) {
          this.emit('online');
        }
      }

      // cache message
      this.cache[event.type] = event.data;
    } catch (error) {
      this.logger.info('Destiny Live socket message parse error: ', error);
    }
  }

  handleError(error) {
    this.logger.info('Destiny Live socket recieved error: ', error.message);
  }
}

module.exports = DestinyLive;
