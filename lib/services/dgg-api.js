const axios = require('axios').default;
const _ = require('lodash');

class DggApi {
  constructor(config, log) {
    this.config = config;
    this.log = log;
  }

  getStreamInfo() {
    return axios
      .get(this.config.url, {
        headers: {
          Accept: 'application/json',
        },
      })
      .then((res) => {
        const twitch = _.get(res, 'data.data.streams.twitch');
        const youtube = _.get(res, 'data.data.streams.youtube');
        return {
          twitch,
          youtube,
        };
      })
      .catch((err) => this.log.error('Error retrieving data from dgg api.', err));
  }
}

module.exports = DggApi;
