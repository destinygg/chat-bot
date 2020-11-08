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

    this.cacheClearingInterval = config.cacheClearingInterval || 600;
    this.maxCacheAge = config.maxCacheAge || 3600;
    // caching could be done using redis service
    this.tweetsCache = {};
    this.logger = logger || console;
    this.timeStampKey = 'twitter';

    this.startCacheClearing();
  }

  static getTweetId(message) {
    const match = /twitter\.com\/\w+\/status\/(\d+)/gi.exec(message);
    if (!match) return null;
    return _.get(match, 1, null);
  }

  clearCache() {
    const now = moment();
    _.forIn(this.tweetsCache, (tweet, id) => {
      if (now - tweet.cachedAt >= this.maxCacheAge) {
        delete this.tweetsCache[id];
      }
    });
  }

  startCacheClearing() {
    setInterval(() => {
      this.clearCache();
    }, this.cacheClearingInterval);
  }

  getTweetDatetime(tweetId) {
    return new Promise((resolve, reject) => {
      if (!tweetId) return reject(new Error('invalid tweet link'));
      if (this.tweetsCache[tweetId]) return resolve(this.tweetsCache[tweetId].createdAt);
      return this.client
        .get('statuses/show.json', { id: tweetId })
        .then((response) => {
          const createdAt = _.get(response, 'created_at', null);
          if (!createdAt) {
            this.logger.error('Tweet data missing creation date', response);
            return reject();
          }
          this.tweetsCache[tweetId] = {
            cachedAt: moment(),
            createdAt,
          };
          return resolve(moment(createdAt, 'ddd MMM DD HH:mm:ss Z YYYY'));
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
