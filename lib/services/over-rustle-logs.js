const axios = require('axios');
const moment = require('moment');
const _ = require('lodash');

// no tears..
class OverrustleLogs {
  constructor(configuration) {
    this.url = configuration.url;
    console.log(this.url);
  }

  getMostRecentLogsForUsers(user) {
    return axios.get(`${this.url}/Destinygg chatlog/${moment().format('MMMM YYYY')}/userlogs/${user}.txt`)
      .then((response) => {
        const messages = _.reverse(response.data.split('\n'));
        return { err: null, errMessage: null, output: `${messages[1]}\n${messages[2]}\n${messages[3]}\n` };
      });
  }

  getLogsUrlForUser(user) {
    return `${this.url}/stalk?channel=Destinygg&nick=${user}`;
  }
}

module.exports = OverrustleLogs;
