const axios = require('axios').default;
const moment = require('moment');

// no tears..
class OverrustleLogs {
  constructor(configuration) {
    this.url = configuration.url;
  }

  getMostRecentLogsForUsers(user, amount) {
    return axios.get(`${this.url}/api/v1/stalk/Destinygg/${user}.json?limit=${amount}`)
      .then(response => response.data.lines.map((message) => {
        const fromNow = moment.tz(message.timestamp, 'X', 'UTC').fromNow();
        return `[${fromNow}] ${user}: ${message.text}`;
      }));
  }

  getLogsUrlForUser(user) {
    return `${this.url}/stalk?channel=Destinygg&nick=${user}`;
  }
}

module.exports = OverrustleLogs;
