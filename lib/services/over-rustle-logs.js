const axios = require('axios').default;
const moment = require('moment');
const formatDuration = require('../chat-utils/format-duration');
// no tears..
class OverrustleLogs {
  constructor(configuration, configuredChat) {
    this.chat = configuredChat === 'dgg' ? 'Destinygg' : 'Destiny';
    this.url = configuration.url;
  }

  getMostRecentLogsForUsers(user, amount) {
    return axios
      .get(`${this.url}/api/v1/stalk/${this.chat}/${user}.json?limit=${amount}`)
      .then((response) =>
        response.data.lines.map((message) => {
          const now = moment.tz('UTC');
          const fromNow = moment.duration(now.diff(moment.tz(message.timestamp, 'X', 'UTC')));
          const output = formatDuration(fromNow);
          return `${output} ago ${user}: ${message.text}`;
        }),
      );
  }

  getLogsUrlForUser(user) {
    return `${this.url}/stalk?channel=Destinygg&nick=${user}`;
  }
}

module.exports = OverrustleLogs;
