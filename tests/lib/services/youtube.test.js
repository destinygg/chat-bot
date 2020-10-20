const assert = require('assert');
const sinon = require('sinon');
const proxyquire  = require('proxyquire').noCallThru();
const mockResponses = require('./mocks/youtube-responses.json')
const moment = require('moment');

describe('Youtube Tests', () => {

  const config = {
      YOUTUBE_API_KEY: 'TEST123',
      YOUTUBE_CHANNEL: 'Destiny',
      liveViewerCountTimeToLiveSeconds: 300
  };

  const pathStub = function(){
  }
  pathStub.youtube = function(config){
    let searchCalled = 0;
    let videosCalled = 0;
    return {
        channels: {
            list: function(payload){
                switch(payload.part) {
                    case 'contentDetails':
                        return Promise.resolve({ data: mockResponses.getChannelsUploadedPlaylistId });
                    case 'id':
                        return Promise.resolve({ data: mockResponses.getChannelIdFromUsername });
                    default:
                        return Promise.reject('YOU FUCKED UP');
                }
            }
        },
        playlistItems: {
            list: function(){
                return Promise.resolve({
                    data: mockResponses.getListOfUploadedVideos
                });
            }
        },
        search: {
            list: function(){
                searchCalled += 1;

                if (searchCalled % 2 === 1) {
                    return Promise.resolve({ data: mockResponses.getActiveLiveBroadcastsVideoId });
                }
                if (searchCalled % 2 === 0) {
                    return Promise.resolve({ data: mockResponses.getActiveLiveBroadcastsVideoIdOffline });
                }
            }
        },
        videos: {
            list: function(){
                videosCalled += 1;

                if (videosCalled === 2) {
                    return Promise.resolve({ data: mockResponses.getConcurrentViewersOffline });
                }
                return Promise.resolve({ data: mockResponses.getConcurrentViewers });
            }
        }
    }
  }

  const youtubeProxy = proxyquire('../../../lib/services/youtube', { 'googleapis': { google: pathStub }})
  const yt = new youtubeProxy(config);

  beforeEach(function () {
    this.clock = sinon.useFakeTimers(1603155310586);
  });

  afterEach(function () {
    this.clock.restore();
    yt.liveViewerCache = {};
  });

  it('Gets a Channels Uploaded Playlist Id', function () {

    return yt.getChannelsUploadedPlaylistId(config.YOUTUBE_CHANNEL)
    .then(function (response) {
        return assert.strictEqual(response, "UU554eY5jNUfDq3yDOJYirOQ");
    });
  });

  it('Gets a Channels Uploaded Playlist Id and caches it', function () {

    return yt.getChannelsUploadedPlaylistId(config.YOUTUBE_CHANNEL)
    .then(function () {
        return assert.strictEqual(yt.playlistId, "UU554eY5jNUfDq3yDOJYirOQ");
    });
  });

  it('Gets a Channels Latest Uploaded Videos Playlist', function () {

    return yt.getListOfUploadedVideos()
    .then(function (response) {
        return assert.equal(response, mockResponses.getListOfUploadedVideos);
    });
  });
  it('Gets a Channels Latest Uploaded Video', function () {

    return yt.getLatestUploadedVideo()
    .then(function (response) {
        return assert.equal(response, mockResponses.getListOfUploadedVideos.items[0]);
    });
  });

  it('Gets the channel id from username', function() {
      return yt.getChannelIdFromUsername(config.YOUTUBE_CHANNEL)
      .then(function (response) {
          return assert.strictEqual(response, 'UC554eY5jNUfDq3yDOJYirOQ')
      });
  });

  it('Gets the channel id from username and caches it', function() {
    return yt.getChannelIdFromUsername(config.YOUTUBE_CHANNEL)
    .then(function () {
        return assert.strictEqual(yt.channelId, 'UC554eY5jNUfDq3yDOJYirOQ')
    });
});

  it('Gets live broadcast details from channel id', function() {
    return yt.getActiveLiveBroadcastsVideoId()
    .then(function (response) {
        return assert.strictEqual(response, 'qif_XUayrWY');
    });
  });

  it('Gets live broadcast details from channel id when offline', function() {
    return yt.getActiveLiveBroadcastsVideoId()
    .then(function (response) {
        return assert.strictEqual(response, null);
    });
  });

  it('Gets live broadcast concurrent viewers count', function() {
    return yt.getChannelStatus()
    .then(function (response) {
        return assert.deepStrictEqual(response, { timestamp: 1603155310, isLive: true, viewers: '1785', started: moment('2020-10-10T19:04:28Z', 'YYYY-MM-DDTHH:mm:ssZ') });
    });
  });

  it('Gets live broadcast concurrent viewers count when offline', function() {
    return yt.getChannelStatus()
    .then(function (response) {
        return assert.deepStrictEqual(response, { timestamp: 1603155310, isLive: false });
    });
  });

  it('uses live viewer cache when not yet expired', function() {
    const meme = yt.getChannelStatus;
    return yt.getChannelStatus()
    .then(function (response) {
        return assert.deepStrictEqual(response, { timestamp: 1603155310, isLive: true, viewers: '1785', started: moment('2020-10-10T19:04:28Z', 'YYYY-MM-DDTHH:mm:ssZ') });
    })
    .then(() => {
        this.clock.tick(1*60*1000);
        console.warn(meme === yt.getChannelStatus)
        return yt.getChannelStatus()
        .then(function (response) {
            return assert.deepStrictEqual(response, { timestamp: 1603155310, isLive: true, viewers: '1785', started: moment('2020-10-10T19:04:28Z', 'YYYY-MM-DDTHH:mm:ssZ') });
        })
    });
  });

  it('refreshes live viewer count when cache expired', function() {
    return yt.getChannelStatus()
    .then(function (response) {
        return assert.deepStrictEqual(response, { timestamp: 1603155310, isLive: true, viewers: '1785', started: moment('2020-10-10T19:04:28Z', 'YYYY-MM-DDTHH:mm:ssZ') });
    })
    .then(() => {
        this.clock.tick(6*60*1000);
        return yt.getChannelStatus()
        .then(function (response) {
            const timestamp = 1603155310+(6*60);
            return assert.deepStrictEqual(response, { timestamp, isLive: true, viewers: '1785', started: moment('2020-10-10T19:04:28Z', 'YYYY-MM-DDTHH:mm:ssZ') });
        })
    });
  });
});
