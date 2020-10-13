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
      this.getChannelStatus()
        .then()
        .catch((err) => {
          this.logger.error('Problem in twitch interval call', err);
        });
    }, 60000);
  }

  getChannelStatus() {
    return axios
      .get('https://api.twitch.tv/kraken/streams/18074328', {
        headers: {
          Accept: 'application/vnd.twitchtv.v5+json',
          'Client-ID': this.clientId,
        },
      })
      .then((data) => {
        const date = _.get(data, 'data.stream.created_at', null);
        const viewers = _.get(data, 'data.stream.viewers', 'Unknown');
        if (date === null) {
          return this.getPastBroadcastInformation().then((pastInfo) => {
            return {
              isLive: false,
              stopped: pastInfo.stopped,
              duration: pastInfo.duration,
            };
          });
        }
        this.wasLiveTimestamp = this.sql
          .addTwitchTimestamp('twitch', moment().unix())
          .then()
          .catch((err) => {
            this.logger.error('Error in storage of twitchTimestamp', err);
          });

        return {
          isLive: true,
          viewers,
          started: moment(date, 'YYYY-MM-DDTHH:mm:ssZ'),
        };
      });
  }

  getPastBroadcastInformation() {
    const context = {};
    return this.sql
      .getTwitchTimestamp(this.timeStampKey)
      .then((timestamp) => {
        context.stopped = moment.tz(timestamp, 'X', 'UTC');
        return axios.get(
          'https://api.twitch.tv/kraken/channels/18074328/videos?limit=1&broadcast_type=archive',
          {
            headers: {
              Accept: 'application/vnd.twitchtv.v5+json',
              'Client-ID': this.clientId,
            },
          },
        );
      })
      .then((data) => {
        const length = _.get(data, 'data.videos.0.length', null);
        return {
          stopped: context.stopped,
          duration: moment.duration(length, 'seconds'),
        };
      });
  }
}

module.exports = TwitchApi;
