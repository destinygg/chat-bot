const axios = require('axios').default;
const moment = require('moment');
const _ = require('lodash');

// no tears..
class OverrustleLogs {
  constructor(configuration) {
    this.url = configuration.url;
  }

  getMostRecentLogsForUsers(user, amount) {
    return axios.get(`${this.url}/Destinygg chatlog/${moment().format('MMMM YYYY')}/userlogs/${user}.txt`)
      .then((response) => {
        const messages = _.takeRight(response.data.split('\n'), amount);
        return messages.map((message) => {
          const time = _.get(/\[(.*)\]/.exec(message), 1, '');
          const fromNow = moment.tz(time, 'YYYY-MM-DD HH:mm:ss', 'UTC').fromNow();
          return message.replace(/\[(.*)\]/, `[${fromNow}]`);
        });
      });
  }

  getLogsUrlForUser(user) {
    return `${this.url}/stalk?channel=Destinygg&nick=${user}`;
  }
}

module.exports = OverrustleLogs;
