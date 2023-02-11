const { TwitterApi: Twitter, ETwitterStreamEvent: TwitterEvent } = require('twitter-api-v2');
const bigInt = require('big-integer');
const moment = require('moment');
const _ = require('lodash');

class TwitterApi {
  constructor(config, logger, messageRelay) {
    this.client = new Twitter(config.bearerToken);
    this.dateFormat = config.dateFormat || 'ddd MMM DD HH:mm:ss Z YYYY';

    this.stream = null;
    this.streamFilter = config.streamFilter || 'from:TheOmniLiberal -is:retweet';

    this.cacheClearingInterval = config.cacheClearingInterval || 600;
    this.maxCacheAge = config.maxCacheAge || 3600;
    // caching could be done using redis service
    this.tweetsCache = {};
    this.logger = logger || console;
    this.messageRelay = messageRelay;
    this.timeStampKey = 'twitter';

    this.startCacheClearing();
    this.startStream();
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

  async updateStreamRules() {
    const rules = await this.client.v2.streamRules();
    if (rules.data) {
      const ruleIndex = rules.data.findIndex((rule) => rule.tag === 'streamer_tweets');
      if (ruleIndex >= 0) {
        if (rules.data[ruleIndex].value === this.streamFilter) return;
        await this.client.v2.updateStreamRules({
          delete: {
            ids: [
              ...rules.data.filter((rule) => rule.tag === 'streamer_tweets').map((rule) => rule.id),
            ],
          },
        });
      }
    }
    await this.client.v2.updateStreamRules({
      add: [{ value: this.streamFilter, tag: 'streamer_tweets' }],
    });
  }

  async startStream() {
    try {
      this.stream = await this.client.v2.searchStream();
      this.updateStreamRules();
      this.stream.on(TwitterEvent.Data, (event) => {
        this.messageRelay.sendOutputMessage(`New Tweet: ${event.data.text}`);
      });
      this.stream.autoReconnect = true;
    } catch (error) {
      this.logger.error('Problem creating twitter stream', error);
    }
  }

  getTweetDatetime(tweetId) {
    return new Promise((resolve, reject) => {
      if (!tweetId) return reject(new Error('invalid tweet link'));
      if (this.tweetsCache[tweetId]) return resolve(this.tweetsCache[tweetId].createdAt);
      if (tweetId.length <= 13) return resolve(moment('2010-10-31T12:00:00.000Z', this.dateFormat));

      const date = new Date(+bigInt(tweetId).shiftRight(22) + 1288834974657);
      return resolve(moment(date, this.dateFormat));
    });
  }

  getTweetDatetimeFromMessage(message) {
    return this.getTweetDatetime(TwitterApi.getTweetId(message));
  }
}

module.exports = TwitterApi;
