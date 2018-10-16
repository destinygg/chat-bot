const TwitchClient = require('twitch').default;
const axios = require('axios');

class TwitchApi {
  constructor(config) {
    this.clientSecret = config.clientSecret;
    this.clientId = config.clientId;
    this.accessToken = config.accessToken;
    this.twitchClient = null;
    this.channelId = config.channelId || 18074328;
  }

  init() {
    this.startClient();
    return true;
  }

  startClient() {
    this.twitchClient = TwitchClient.withCredentials(this.clientId, this.accessToken);
  }

  getClient() {
    return this.twitchClient;
  }

  getAccessToken() {
    return axios({
      method: 'get',
      maxRedirects: 0,
      url: `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=${this.clientId}&redirect_uri=http://localhost&scope=channel:moderate+chat:edit+chat:read`,
    }).then((response) => {
      console.log(response);
    }).catch((err) => {
      console.log(err);
    });
  }

  getChannelStatus() {
    this.twitchClient.channels.getChannel('18074328').then((data) => {
      console.log(data.status);
    }).catch((err) => {
    });
  }
}

module.exports = TwitchApi;
