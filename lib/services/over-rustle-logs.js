const axios = require('axios').default;
const moment = require('moment');

// no tears..
class OverrustleLogs {
  constructor(configuration, configuredChat) {
    this.chat = configuredChat === 'dgg' ? 'Destinygg' : 'Destiny';
    this.url = configuration.url;
  }

  getMostRecentLogsForUsers(user, amount) {
    return axios.get(`${this.url}/api/v1/stalk/${this.chat}/${user}.json?limit=${amount}`)
      .then(response => response.data.lines.map((message) => {
        const now = moment.tz('UTC');
        const fromNow = moment.duration(now.diff(moment.tz(message.timestamp, 'X', 'UTC')));
        const years = fromNow.years();
        const months = fromNow.months();
        const days = fromNow.days();
        const hours = fromNow.hours();
        const minutes = fromNow.minutes();
        let output;
        const formatS = (theTime, theString) => `${theTime} ${(theTime > 1 ? `${theString}s` : theString)}`;

        if (years > 0) {
          output = `${formatS(years, 'year')} ago`;
        } else if (months > 0) {
          output = `${formatS(months, 'month')} ${formatS(days, 'day')} ago`;
        } else if (days > 0) {
          output = `${formatS(days, 'day')} ${hours}h ago`;
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
