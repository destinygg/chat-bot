const { client: TwitchJsClient } = require('twitch-js');
const _ = require('lodash');
const EventEmitter = require('events');
const { parseCommand } = require('../chat-utils/parse-commands-from-chat');

class TwitchChatListener extends EventEmitter {
  constructor(config, services) {
    super();
    this.channel = config.channelId;
    const token = config.accessToken;
    const { clientId } = config;

    this.logger = services.logger;

    this.options = {
      options: {
        clientId,
      },
      connection: {
        reconnect: true,
      },
      identity: {
        username: this.channel,
        password: `oauth:${token}`,
      },
      channels: [this.channel],
    };
  }

  connect() {
    this.client = new TwitchJsClient(this.options);
    this.client.on('message', this.parseMessages.bind(this));
    this.client.on('connected', e => {
      this.emit('open', e);
    });
    this.client.connect().catch(err => {
      this.logger.error('Problem logging into twitch:', err);

      // eslint-disable-next-line no-process-exit
      process.exit(0);
    });
  }

  sendMessage(message) {
    this.client.say(this.channel, message).catch(err => {
      // This happens? Just crash and restart.
      this.logger.error(`Error in twitch message say: ${err}`);
      if (_.includes(err.message, 'not opened')) {
        // eslint-disable-next-line no-process-exit
        process.exit(0);
      }
    });
  }

  sendWhisper(user, message) {
    this.client
      .whisper(user, message)
      .then()
      .catch(err => {
        this.logger.error(err);
      });
  }

  sendMute(punished) {
    this.client
      .timeout(this.channel, punished.user, Math.ceil(punished.duration), punished.reason)
      .then(() => {
        this.sendMessage(punished.reason);
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  sendBan(punished) {
    this.client
      .ban(this.channel, punished.user, punished.reason)
      .then(() => {
        this.sendMessage(punished.reason);
      })
      .catch(err => {
        this.logger.error('Error while banning on twitch.', err);
      });
  }

  sendUnban(punished) {
    this.client
      .unban(this.channel, punished.user)
      .then()
      .catch(err => {
        this.logger.error('Error while unbanning on twitch.', err);
      });
  }

  // No unmute, you have to overwrite the last mute with a 1 second timeout.
  sendUnmute(punished) {
    this.client.timeout(this.channel, punished.user, 1, '').catch(err => {
      this.logger.error(err);
    });
  }

  parseMessages(channel, userState, message, self) {
    if (self) {
      return;
    }

    // Handle different message types..
    if (
      userState['message-type'] === 'chat' ||
      userState['message-type'] === 'whisper' ||
      userState['message-type'] === 'action'
    ) {
      const isWhisper = userState['message-type'] === 'whisper';
      const parsedMessage = {
        user: userState.username,
        userId: userState['user-id'],
        roles: _.keys(userState.badges).map(badge => (badge === 'broadcaster' ? 'admin' : badge)),
        message,
      };

      if (isWhisper === false) this.emit('message', parsedMessage);

      if (_.startsWith(message, '!')) {
        this.emit('command', {
          parsedMessage,
          isWhisper,
          parsedCommand: parseCommand(message),
        });
      }
    }
  }
}

module.exports = TwitchChatListener;
