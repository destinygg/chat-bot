const axios = require('axios').default;
const _ = require('lodash');

class GithubApi {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }

  getGuiReleaseInfo() {
    return axios
      .get(this.config.gui_url)
      .then((response) => {
        return response.data;
      })
      .catch((err) => this.logger.error('Error retrieving data from github api.', err));
  }
}

module.exports = GithubApi;
