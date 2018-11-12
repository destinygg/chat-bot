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
        const now = moment.tz('UTC');
        const fromNow = moment.duration(now.diff(moment.tz(message.timestamp, 'X', 'UTC')));
        const years = fromNow.years();
        const months = fromNow.months();
        const days = fromNow.days();
        const hours = fromNow.hours();
        const minutes = fromNow.minutes();
        let output;
        if (years > 0) {
          output = `${years} years ago`;
        } else if (months > 0) {
          output = `${months} months ${days} days ago`;
        } else if (days > 0) {
          output = `${days} days ${hours}h ago`;
        } else {
          output = hours > 0 ? `${hours}h ${minutes}m ago`
            : `${minutes}m ago`;
        }
        return `${output} ${user}: ${message.text}`;
      }));
  }

  getLogsUrlForUser(user) {
    return `${this.url}/stalk?channel=Destinygg&nick=${user}`;
  }
}

module.exports = OverrustleLogs;
