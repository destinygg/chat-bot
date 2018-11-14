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
    this.client.on('connected', (e) => {
      this.emit('open', e);
    });
    this.client.connect().catch((err) => {
      this.logger.error('Problem logging into twitch:', err);

      // eslint-disable-next-line
      process.exit(0);
    });
  }

  sendMessage(message) {
    this.client.say(this.channel, message);
  }

  sendMute(punished) {
    this.client.timeout(this.channel, punished.user,
      Math.ceil(punished.duration), punished.reason)
      .then(() => {
        this.client.sendMessage(punished.reason);
      })
      .catch((err) => {
        this.logger.error(err);
      });
  }

  sendBan(punished) {
    this.client.ban(this.channel, punished.user, punished.reason)
      .then(() => {
        this.client.sendMessage(punished.reason);
      })
      .catch((err) => {
        this.logger.error('Error while banning on twitch.', err);
      });
  }

  sendUnban(punished) {
    this.client.unban(this.channel, punished.user).then()
      .catch((err) => {
        this.logger.error('Error while unbanning on twitch.', err);
      });
  }

  // No unmute, you have to overwrite the last mute with a 1 second timeout.
  sendUnmute(punished) {
    this.client.timeout(this.channel, punished.user, 1, '')
      .catch((err) => {
        this.logger.error(err);
      });
  }


  parseMessages(channel, userState, message, self) {
    if (self) {
      return;
    }
    // Handle different message types..
    if (userState['message-type'] === 'chat') {
      const parsedMessage = {
        user: userState.username,
        userId: userState['user-id'],
        isPrivileged: userState.mod,
        roles: _.keys(userState.badges),
        message,
      };
      this.emit('message', parsedMessage);
      if (_.startsWith(message, '!')) {
        this.emit('command', {
          parsedMessage,
          parsedCommand: parseCommand(message),
        });
      }
    }
  }
}

module.exports = TwitchChatListener;
