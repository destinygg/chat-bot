const axios = require('axios').default;
const moment = require('moment');
const _ = require('lodash');

// no tears..
class OverrustleLogs {
  constructor(configuration) {
    this.url = configuration.url;
  }

  getMostRecentLogsForUsers(user) {
    return axios.get(`${this.url}/Destinygg chatlog/${moment().format('MMMM YYYY')}/userlogs/${user}.txt`)
      .then((response) => {
        const messages = _.takeRight(response.data.split('\n'), 5);
        return messages;
      });
  }

  getLogsUrlForUser(user) {
    return `${this.url}/stalk?channel=Destinygg&nick=${user}`;
  }
}

module.exports = OverrustleLogs;
