const Twitter = require('twitter');
const moment = require('moment');
const _ = require('lodash');

class TwitterApi {
  constructor(config, logger) {
    this.client = new Twitter({
      consumer_key: config.consumerKey,
      consumer_secret: config.consumerSecret,
      bearer_token: config.bearerToken,
    });
    this.dateFormat = config.dateFormat || 'ddd MMM DD HH:mm:ss Z YYYY';

    this.logger = logger;
    this.timeStampKey = 'twitter';
  }

  static getTweetId(message) {
    const match = /twitter\.com\/\w+\/status\/(\d+)/gi.exec(message);
    if (!match) return null;
    return _.get(match, 1, null);
  }

  getTweetDatetime(tweetId) {
    return new Promise((resolve, reject) => {
      if (!tweetId) return reject(new Error('invalid tweet link'));
      this.client
        .get('statuses/show.json', { id: tweetId })
        .then((response) => {
          const createdAt = _.get(response, 'created_at', null);
          if (!createdAt) {
            this.logger.error('Tweet data missing creation date', response);
            return reject();
          }
          resolve(moment(response.created_at, 'ddd MMM DD HH:mm:ss Z YYYY'));
        })
        .catch((errors) => {
          this.logger.error('Problem retrieving tweet data', errors);
          reject(errors);
        });
    });
  }

  getTweetDatetimeFromMessage(message) {
    return this.getTweetDatetime(TwitterApi.getTweetId(message));
  }
}

module.exports = TwitterApi;
