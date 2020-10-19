const _ = require('lodash');
const EventEmitter = require('events');
const { parseCommand } = require('../chat-utils/parse-commands-from-chat');

// TODO: Remove debugs
// TODO: Solution for channelId
// TODO: Solution for unbans
class YoutubeChatListener extends EventEmitter {
  /**
   * @param {import("../services/service-index")} services
   */
  constructor(config, services) {
    super();
    this.youtube = services.youtube;
    this.logger = services.logger;

    // TODO: Make configurable
    this.livePollDelay = 1000;

    this.isOnline = false;
    this.liveChatId = null;
    this.pageToken = '';
  }

  setOffline() {
    this.isOnline = false;
    this.liveChatId = null;
    this.pageToken = null;
  }

  async connect() {
    if (!this.isOnline || !this.liveChatId) {
      this.logger.debug('Checking youtube live status');
      const { isLive, liveChatId } = await this.youtube.getChannelStatus();
      if (!isLive || !liveChatId) {
        this.setOffline();
        setTimeout(this.connect, this.livePollDelay);
        return;
      }
      this.emit('open', true);
      this.isOnline = true;
      this.liveChatId = liveChatId || null;
    }

    try {
      this.logger.debug('Fetching live youtube messages');
      const messagesResponse = await this.youtube.getYoutubeApi().liveChatMessages.list({
        liveChatId: this.liveChatId,
        part: 'id,snippet,authorDetails',
        ...(this.pageToken && { pageToken: this.pageToken }),
      });
      this.logger.debug(`Iterating over ${messagesResponse.data.items.length} messages`);
      messagesResponse.data.items.forEach(this.parseMessages.bind(this));
      this.pageToken = messagesResponse.pageToken;
      // Only present if the stream is already offline
      if (messagesResponse.data.offlineAt) {
        this.setOffline();
        setTimeout(this.connect, this.livePollDelay);
        return;
      }
      this.logger.debug(
        `Set to fetch next batch in ${messagesResponse.data.pollingIntervalMillis} milliseconds`,
      );
      setTimeout(this.connect, messagesResponse.data.pollingIntervalMillis);
    } catch (err) {
      this.logger.error('Problem getting batch of youtube live mesages:', err);
      // Retry?
      setTimeout(this.connect, this.livePollDelay);
    }
  }

  sendMessage(message) {
    this.youtube
      .getYoutubeApi()
      .liveChatMessages.insert({
        part: ['snippet'],
        snippet: {
          liveChatId: this.liveChatId,
          type: 'textMessageEvent',
          textMessageDetails: {
            messageText: message,
          },
        },
      })
      .catch((err) => {
        this.logger.error('Error in youtube sendMessage:', err);
      });
  }

  // eslint-disable-next-line no-unused-vars, class-methods-use-this
  sendWhisper(user, message) {}

  sendMute(punished) {
    this.youtube
      .getYoutubeApi()
      .liveChatBans.insert({
        part: ['snippet'],
        resource: {
          snippet: {
            liveChatId: this.liveChatId,
            type: 'temporary',
            banDurationSeconds: Math.ceil(punished.duration),
            bannedUserDetails: {
              channelId: punished.user,
            },
          },
        },
      })
      .then(this.sendMessage(punished.reason))
      .catch((err) => this.logger.error('Error while muting on youtube:', err));
  }

  sendBan(punished) {
    this.youtube
      .getYoutubeApi()
      .liveChatBans.insert({
        part: ['snippet'],
        resource: {
          snippet: {
            liveChatId: this.liveChatId,
            type: punished.isPermanent ? 'permanent' : 'temporary',
            ...(!punished.isPermanent && { banDurationSeconds: Math.ceil(punished.duration) }),
            bannedUserDetails: {
              channelId: punished.user,
            },
          },
        },
      })
      .then(this.sendMessage(punished.reason))
      .catch((err) => this.logger.error('Error while banning on youtube:', err));
  }

  // eslint-disable-next-line no-unused-vars, class-methods-use-this
  sendUnban(punished) {
    // No unbans! :hypers:
    // Unbans require storing the ban id, should we do it?
  }

  // eslint-disable-next-line no-unused-vars, class-methods-use-this
  sendUnmute(punished) {
    // No Unmutes! :hypers:
    // Unmutes require storing the ban id, should we do it?
  }

  /**
   * @param {import("googleapis").youtube_v3.Schema$LiveChatMessage} message
   */
  parseMessages(message) {
    const { authorDetails, snippet } = message;
    if (snippet.type === 'textMessageEvent') {
      const parsedMessage = {
        user: authorDetails.channelId,
        roles: [
          authorDetails.isChatOwner && 'admin',
          authorDetails.isChatModerator && 'moderator',
          authorDetails.isChatSponsor && 'sponsor',
          authorDetails.isVerified && 'verified',
        ].filter((role) => !!role),
        message: snippet.displayMessage,
      };

      if (_.startsWith(snippet.displayMessage, '!')) {
        this.emit('command', {
          parsedMessage,
          isWhisper: false,
          parsedCommand: parseCommand(snippet.displayMessage),
        });
      }
      this.emit('message');
    }

    return this.logger;
  }
}

module.exports = YoutubeChatListener;
