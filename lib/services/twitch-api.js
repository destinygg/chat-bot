const TwitchClient = require('twitch').default;

class TwitchApi {
  constructor(config) {
    this.userId = config.userId;
    this.clientSecret = config.clientSecret;
    this.clientId = config.clientId;
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.twitchClient = null;
  }

  init() {
    this.startClient();
    return true;
  }

  async startClient() {
    const refreshedAccessToken = await TwitchClient.refreshAccessToken(
      this.clientId, this.clientSecret, this.refreshToken,
    );
    this.accessToken = refreshedAccessToken.accessToken;
    this.refreshToken = refreshedAccessToken.refreshToken;

    this.twitchClient = TwitchClient.withCredentials(this.clientId, this.accessToken, {
      clientSecret: this.clientSecret,
      refreshToken: this.refreshToken,
      onRefresh: (token) => {
        this.accessToken = token.accessToken;
        this.refreshToken = token.refreshToken;
      },
    });
  }

  getClient() {
    return this.twitchClient;
  }

  async getChannelDisplayName() {
    const user = await this.twitchClient.users.getUser(this.userId);
    if (!user) {
      throw new Error(`Could not find user with id ${this.userId}`);
    }
    return user.displayName;
  }

  async getStreamStatus() {
    const user = await this.twitchClient.users.getUser(this.userId);
    if (!user) {
      throw new Error(`Could not find user with id ${this.userId}`);
    }

    const stream = await user.getStream();
    const isLive = stream !== null;
    const videos = await this.twitchClient.helix.videos.getVideosByUser(user);
    const videosPage = await videos.getNext();

    if (videosPage.length > 0) {
      const video = videosPage[0];
      const { publishDate } = video;
      const startTime = new Date(publishDate.getTime());

      return {
        isLive,
        lastStartTime: startTime,
      };
    }
    return {
      isLive,
      lastStartTime: null,
    };
  }
}

module.exports = TwitchApi;
