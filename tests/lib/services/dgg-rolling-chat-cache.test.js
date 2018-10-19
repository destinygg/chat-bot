const assert = require('assert');
const sinon = require('sinon');
const RollingChatCache = require('../../../lib/services/dgg-rolling-chat-cache');

describe('Chat Cache Test suite', () => {
  describe('Chat Cache Viewer Map Tests', () => {
    it('add messages to the cache for a given user', () => {
      const chatCache = new RollingChatCache({});
      const expected = {
        linusred: ['hey nice meme man'],
      };
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      assert.deepStrictEqual(chatCache.viewerMap, expected);
    });

    it('add messages to the cache for a given user up to the default of 2', () => {
      const chatCache = new RollingChatCache({});
      const expected = {
        linusred: ['hey nice meme man', 'really cool'],
      };
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      chatCache.addMessageToCache('linusred', 'really cool');

      assert.deepStrictEqual(chatCache.viewerMap, expected);
    });

    it('add messages to the cache for a given user and replaces messages if the number of messages is above the threshold', () => {
      const chatCache = new RollingChatCache({});
      const expected = {
        linusred: ['really cool', 'nice'],
      };
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      chatCache.addMessageToCache('linusred', 'really cool');
      chatCache.addMessageToCache('linusred', 'nice');

      assert.deepStrictEqual(chatCache.viewerMap, expected);
    });

    it('add messages to the cache for multiple users', () => {
      const chatCache = new RollingChatCache({});
      const expected = {
        linusred: ['hey nice meme man'],
        bob: ['really cool']
      };
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      chatCache.addMessageToCache('bob', 'really cool');

      assert.deepStrictEqual(chatCache.viewerMap, expected);
    });

    it('returns expected value for diffed messages that are the same', () => {
      const chatCache = new RollingChatCache({});
      const expected = [1];
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      const result = chatCache.diffNewMessageForUser('linusred', 'hey nice meme man');
      assert.deepStrictEqual(result, expected);
    });

    it('returns expected value for diffed messages that are diferent', () => {
      const chatCache = new RollingChatCache({});
      const expected = [0.9];
      chatCache.addMessageToCache('linusred', '1234567890');
      const result = chatCache.diffNewMessageForUser('linusred', '123456789');
      assert.deepStrictEqual(result, expected);
    });

    it('returns expected value for diffed messages that are crazy', () => {
      const chatCache = new RollingChatCache({});
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
      this.clock = sinon.useFakeTimers();
    });

    afterEach(function () {
      this.clock.restore();
    });

    it('adds a message to the tombstone with a timestamp cache', function () {
      const chatCache = new RollingChatCache({});
      const expected = {
        linusred: 0,
      };
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      assert.deepStrictEqual(chatCache.tombStoneMap, expected);
    });

    it('expires and removes a set of message after a duration of time', function () {
      const chatCache = new RollingChatCache({});
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      this.clock.tick(1800000);
      assert.deepStrictEqual(chatCache.tombStoneMap, {});
    });

    it('expires messages for many users after a given period of time', function () {
      const chatCache = new RollingChatCache({});
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      chatCache.addMessageToCache('neat', 'hey nice meme man');
      chatCache.addMessageToCache('cool', 'hey nice meme man');
      chatCache.addMessageToCache('kyle', 'hey nice meme man');
      this.clock.tick(1800000);
      assert.deepStrictEqual(chatCache.tombStoneMap, {});
    });

    it('updates expire time upon a new messages being added', function () {
      const chatCache = new RollingChatCache({});
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

  describe('Chat Cache Running List', () => {
    it('adds a message to running list', function () {
      const chatCache = new RollingChatCache({});
      const expected = [{user: 'linusred', message: 'hey nice meme man'}];
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      assert.deepStrictEqual(chatCache.runningMessageList, expected);
    });

    it('adds many messages to running list', function () {
      const chatCache = new RollingChatCache({});
      const expected = [{user: 'linusred', message: 'hey nice meme man'},
        {user: 'jimbo', message: 'hey'}];
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      chatCache.addMessageToCache('jimbo', 'hey');
      assert.deepStrictEqual(chatCache.runningMessageList, expected);
    });


    it('replaces the first messages when the queue is full', function () {
      const chatCache = new RollingChatCache({messsagesToKeepPerUser: 10, maxMessagesInList: 2, timeToLive:0, tombStoneInterval: 0});
      const expected = [{user: 'jimbo', message: 'hey'},
        {user: 'jimbo', message: 'cool'}];
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      chatCache.addMessageToCache('jimbo', 'hey');
      chatCache.addMessageToCache('jimbo', 'cool');
      assert.deepStrictEqual(chatCache.runningMessageList, expected);
    });

    it('replaces many messages when the queue is full', function () {
      const chatCache = new RollingChatCache({messsagesToKeepPerUser: 10, maxMessagesInList: 2, timeToLive:0, tombStoneInterval: 0});
      const expected = [{user: 'linusred', message: 'eugh'},
        {user: 'linusred', message: 'dank memes'}];
      chatCache.addMessageToCache('linusred', 'hey nice meme man');
      chatCache.addMessageToCache('jimbo', 'hey');
      chatCache.addMessageToCache('jimbo', 'cool');
      chatCache.addMessageToCache('linusred', 'eugh');
      chatCache.addMessageToCache('linusred', 'dank memes');
      assert.deepStrictEqual(chatCache.runningMessageList, expected);
    });
  });
});

