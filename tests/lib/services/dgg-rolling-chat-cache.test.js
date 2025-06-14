const assert = require('assert');
const sinon = require('sinon');
const RollingChatCache = require('../../../lib/services/dgg-rolling-chat-cache');
const messageMatchingService = require('../../../lib/services/message-matching');
const Logger = require('bunyan');

describe('Chat Cache Test suite', () => {
  describe('Chat Cache Viewer Map Tests', () => {
    beforeEach(() => {
      this.mockServices = {
        logger: sinon.createStubInstance(Logger),
        messageMatching: messageMatchingService,
      };
    });

    it('add messages to the cache for a given user', () => {
      const chatCache = new RollingChatCache({viewerMessageMinimumLength: 1}, this.mockServices);
      const expected = {
        linusred: ['hey nice meme man'],
      };
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      assert.deepStrictEqual(chatCache.viewerMap, expected);
    });

    it('add messages to the cache for a given user up to the default of 2', () => {
      const chatCache = new RollingChatCache({viewerMessageMinimumLength: 1}, this.mockServices);
      const expected = {
        linusred: ['hey nice meme man', 'really cool'],
      };
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      chatCache.addMessageToCache('linusred', 'really cool');

      assert.deepStrictEqual(chatCache.viewerMap, expected);
    });

    it('add messages to the cache for a given user and replaces messages if the number of messages is above the threshold', () => {
      const chatCache = new RollingChatCache({viewerMessageMinimumLength: 1}, this.mockServices);
      const expected = {
        linusred: ['really cool', 'nice'],
      };
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      chatCache.addMessageToCache('linusred', 'really cool');
      chatCache.addMessageToCache('linusred', 'nice');

      assert.deepStrictEqual(chatCache.viewerMap, expected);
    });

    it('add messages to the cache for multiple users', () => {
      const chatCache = new RollingChatCache({viewerMessageMinimumLength: 1}, this.mockServices);
      const expected = {
        linusred: ['hey nice meme man'],
        bob: ['really cool']
      };
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      chatCache.addMessageToCache('bob', 'really cool');

      assert.deepStrictEqual(chatCache.viewerMap, expected);
    });

    it('returns expected value for diffed messages that are the same', () => {
      const chatCache = new RollingChatCache({viewerMessageMinimumLength: 1}, this.mockServices);
      const expected = [1];
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      const result = chatCache.diffNewMessageForUser('linusred', 'hey nice meme man');
      assert.deepStrictEqual(result, expected);
    });

    it('returns expected value for diffed messages that are diferent', () => {
      const chatCache = new RollingChatCache({viewerMessageMinimumLength: 1}, this.mockServices);
      const expected = [0.9];
      chatCache.addMessageToCache('linusred', '1234567890');
      const result = chatCache.diffNewMessageForUser('linusred', '123456789');
      assert.deepStrictEqual(result, expected);
    });

    it('returns expected value for diffed messages that are crazy', () => {
      const chatCache = new RollingChatCache({viewerMessageMinimumLength: 1}, this.mockServices);
      const expected = [1];
      chatCache.addMessageToCache('linusred', `
      \`  (¯\\\`·.¸¸.·´¯\\\`·.¸¸.·´¯)
  ( \\\\                 / )
 ( \\\\ )               ( / )
( ) (                 ) ( )
 ( / )               ( \\\\ )
  ( /                 \\\\ )
   (_.·´¯\\\`·.¸¸.·´¯\\\`·.¸_)\``);
      const result = chatCache.diffNewMessageForUser('linusred', `
      \`  (¯\\\`·.¸¸.·´¯\\\`·.¸¸.·´¯)
  ( \\\\                 / )
 ( \\\\ )               ( / )
( ) (                 ) ( )
 ( / )               ( \\\\ )
  ( /                 \\\\ )
   (_.·´¯\\\`·.¸¸.·´¯\\\`·.¸_)\``);
      assert.deepStrictEqual(result, expected);
    });
  });


  describe('Chat Cache Tombstoning Tests', () => {
    beforeEach(function () {
      this.mockServices = {
        logger: sinon.createStubInstance(Logger),
        messageMatching: messageMatchingService,
      };
      this.clock = sinon.useFakeTimers();
    });

    afterEach(function () {
      this.clock.restore();
    });

    it('adds a message to the tombstone with a timestamp cache', function () {
      const chatCache = new RollingChatCache({viewerMessageMinimumLength: 1}, this.mockServices);
      const expected = {
        linusred: 0,
      };
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      assert.deepStrictEqual(chatCache.tombStoneMap, expected);
    });

    it('expires and removes a set of message after a duration of time', function () {
      const chatCache = new RollingChatCache({viewerMessageMinimumLength: 1}, this.mockServices);
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      this.clock.tick(1800000);
      assert.deepStrictEqual(chatCache.tombStoneMap, {});
    });

    it('expires messages for many users after a given period of time', function () {
      const chatCache = new RollingChatCache({viewerMessageMinimumLength: 1}, this.mockServices);
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      chatCache.addMessageToCache('neat', 'hey nice meme man');
      chatCache.addMessageToCache('cool', 'hey nice meme man');
      chatCache.addMessageToCache('kyle', 'hey nice meme man');
      this.clock.tick(1800000);
      assert.deepStrictEqual(chatCache.tombStoneMap, {});
    });

    it('updates expire time upon a new messages being added', function () {
      const chatCache = new RollingChatCache({viewerMessageMinimumLength: 1}, this.mockServices);
      const expected = {
        linusred: 900, neat: 900, cool: 900, kyle: 900
      };
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      chatCache.addMessageToCache('neat', 'hey nice meme man');
      chatCache.addMessageToCache('cool', 'hey nice meme man');
      chatCache.addMessageToCache('kyle', 'hey nice meme man');

      this.clock.tick(900000);
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      chatCache.addMessageToCache('neat', 'hey nice meme man');
      chatCache.addMessageToCache('cool', 'hey nice meme man');
      chatCache.addMessageToCache('kyle', 'hey nice meme man');
      this.clock.tick(900000);
      assert.deepStrictEqual(chatCache.tombStoneMap, expected);
    });
  });

  describe('Chat Cache Rate Limit Tests', () => {
    beforeEach(function () {
      this.mockServices = {
        logger: sinon.createStubInstance(Logger),
        messageMatching: messageMatchingService,
      };
      this.clock = sinon.useFakeTimers();
    });

    afterEach(function () {
      this.clock.restore();
    });

    it('rate limits if theres not enough time between messages', function () {
      const chatCache = new RollingChatCache({viewerMessageMinimumLength: 1}, this.mockServices);

      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      assert.deepStrictEqual(chatCache.isPastRateLimit('linusred'), true);
    });

    it('does not rate limit if messages are spread out', function () {
      const chatCache = new RollingChatCache({viewerMessageMinimumLength: 1}, this.mockServices);

      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      this.clock.tick(2000);
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      this.clock.tick(2000);
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      this.clock.tick(2000);
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      this.clock.tick(2000);
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      this.clock.tick(2000);
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      this.clock.tick(2000);
      assert.deepStrictEqual(chatCache.isPastRateLimit('linusred'), false);
    });
  });

  describe('Chat Cache Running List', () => {
    beforeEach(function () {
      this.mockServices = {
        logger: sinon.createStubInstance(Logger),
        messageMatching: messageMatchingService,
      };
      this.clock = sinon.useFakeTimers();
      this.clock.tick(0)
    });

    afterEach(function () {
      this.clock.restore();
    });
    it('adds a message to running list', function () {
      const chatCache = new RollingChatCache({}, this.mockServices);
      const expected = [{user: 'linusred', message: 'hey nice meme man', timeStamp: 0}];
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      assert.deepStrictEqual(chatCache.runningMessageList, expected);
    });

    it('adds many messages to running list', function () {
      const chatCache = new RollingChatCache({}, this.mockServices);
      const expected = [{user: 'linusred', message: 'hey nice meme man', timeStamp: 0},
        {user: 'jimbo', message: 'hey', timeStamp: 0}];
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      chatCache.addMessageToCache('jimbo', 'hey');
      assert.deepStrictEqual(chatCache.runningMessageList, expected);
    });


    it('replaces the first messages when the queue is full', function () {
      const chatCache = new RollingChatCache({messsagesToKeepPerUser: 10, maxMessagesInList: 2, timeToLive:0, tombStoneInterval: 0}, this.mockServices);
      const expected = [{user: 'jimbo', message: 'hey', timeStamp: 0},
        {user: 'jimbo', message: 'cool', timeStamp: 0}];
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      chatCache.addMessageToCache('jimbo', 'hey');
      chatCache.addMessageToCache('jimbo', 'cool');
      assert.deepStrictEqual(chatCache.runningMessageList, expected);
    });

    it('replaces many messages when the queue is full', function () {
      const chatCache = new RollingChatCache({messsagesToKeepPerUser: 10, maxMessagesInList: 2, timeToLive:0, tombStoneInterval: 0}, this.mockServices);
      const expected = [{user: 'linusred', message: 'eugh', timeStamp: 0},
        {user: 'linusred', message: 'dank memes', timeStamp: 0}];
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      chatCache.addMessageToCache('jimbo', 'hey');
      chatCache.addMessageToCache('jimbo', 'cool');
      chatCache.addMessageToCache('linusred', 'eugh');
      chatCache.addMessageToCache('linusred', 'dank memes');
      assert.deepStrictEqual(chatCache.runningMessageList, expected);
    });
  });

  describe('Chat Cache Recent URLs Tests', () => {
    beforeEach(function () {
      this.mockServices = {
        logger: sinon.createStubInstance(Logger),
        messageMatching: messageMatchingService,
      };
      this.clock = sinon.useFakeTimers();
    });

    afterEach(function () {
      this.clock.restore();
    });

    it('adds URLs from messages to recentUrls list', function () {
      const chatCache = new RollingChatCache({}, this.mockServices);
      chatCache.addMessageToCache('user1', 'Check out https://example.com/path');
      chatCache.addMessageToCache('user2', 'Also see https://test.com/other');

      const recentUrls = chatCache.getRecentUrls();
      assert.deepStrictEqual(recentUrls, ['example.com/path', 'test.com/other']);
    });

    it('normalizes URLs by removing query parameters and protocol', function () {
      const chatCache = new RollingChatCache({}, this.mockServices);
      chatCache.addMessageToCache('user1', 'https://example.com/path?param=value');
      chatCache.addMessageToCache('user2', 'http://test.com/other#fragment');

      const recentUrls = chatCache.getRecentUrls();
      assert.deepStrictEqual(recentUrls, ['example.com/path', 'test.com/other']);
    });

    it('expires URLs after the configured TTL', function () {
      const chatCache = new RollingChatCache({ urlTtlSeconds: 300 }, this.mockServices);
      chatCache.addMessageToCache('user1', 'https://example.com/path');

      // URLs should be present initially
      assert.deepStrictEqual(chatCache.getRecentUrls(), ['example.com/path']);

      // Advance time past TTL
      this.clock.tick(301000); // 301 seconds

      // URLs should be expired
      assert.deepStrictEqual(chatCache.getRecentUrls(), []);
    });

    it('handles multiple URLs in a single message', function () {
      const chatCache = new RollingChatCache({}, this.mockServices);
      chatCache.addMessageToCache(
        'user1',
        'Check https://example.com/path and https://test.com/other',
      );

      const recentUrls = chatCache.getRecentUrls();
      assert.deepStrictEqual(recentUrls, ['example.com/path', 'test.com/other']);
    });

    it('maintains URLs within TTL period', function () {
      const chatCache = new RollingChatCache({ urlTtlSeconds: 300 }, this.mockServices);
      chatCache.addMessageToCache('user1', 'https://example.com/path');

      // Advance time but stay within TTL
      this.clock.tick(200000); // 200 seconds

      // URLs should still be present
      assert.deepStrictEqual(chatCache.getRecentUrls(), ['example.com/path']);
    });

    it('handles messages with no URLs', function () {
      const chatCache = new RollingChatCache({}, this.mockServices);
      chatCache.addMessageToCache('user1', 'This message has no URLs');

      assert.deepStrictEqual(chatCache.getRecentUrls(), []);
    });
  });
});
