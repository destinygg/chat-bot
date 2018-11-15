const axios = require('axios').default;
const moment = require('moment');
const _ = require('lodash');

class TwitchApi {
  constructor(config, sql, logger) {
    this.clientSecret = config.clientSecret;
    this.clientId = config.clientId;
    this.accessToken = config.accessToken;
    this.channelId = config.channelId || 18074328;
    this.logger = logger;
    this.sql = sql;
    this.timeStampKey = 'twitch';
    this.wasLiveTimestamp = null;

    setInterval(() => {
      this.getChannelStatus().then().catch((err) => {
        this.logger.error('Problem in twitch interval call', err);
      });
    }, 60000);
  }

  getChannelStatus() {
    return axios.get('https://api.twitch.tv/kraken/streams/destiny', {
      headers:
        {
          'Client-ID': this.clientId,
        },
    }).then((data) => {
      const date = _.get(data, 'data.stream.created_at', null);
      const viewers = _.get(data, 'data.stream.viewers', 'Unknown');
      if (date === null) {
        return this.sql.getTwitchTimestamp(this.timeStampKey)
          .then(timestamp => `Stream was last online ${moment(timestamp, 'X').fromNow()}`);
      }
      this.wasLiveTimestamp = this.sql.addTwitchTimestamp('twitch', moment().unix())
        .then()
        .catch((err) => {
          this.logger.error('Error in storage of twitchTimestamp', err);
        });
      return `Viewers: ${viewers}. Stream live as of ${moment(date, 'YYYY-MM-DDTHH:mm:ssZ').fromNow()}`;
    });
  }
}

module.exports = TwitchApi;
