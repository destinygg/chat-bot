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
        const streams = _.get(res, 'data.data.streams');
        return _.values(streams);
      })
      .catch((err) => this.log.error('Error retrieving data from dgg api.', err));
  }
}

module.exports = DggApi;
