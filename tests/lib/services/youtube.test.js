const assert = require('assert');
const sinon = require('sinon');
const proxyquire  = require('proxyquire').noCallThru();
const mockResponses = require('./mocks/youtube-responses.json')
const moment = require('moment');

describe('Youtube Tests', () => {

  const config = {
      YOUTUBE_API_KEY: 'TEST123',
      YOUTUBE_CHANNEL: 'Destiny'
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
                console.warn(`videosCalled ${videosCalled}`);
                if (videosCalled === 1) {
                    return Promise.resolve({ data: mockResponses.getConcurrentViewers });
                }
                if (videosCalled === 2) {
                    return Promise.resolve({ data: mockResponses.getConcurrentViewersOffline });
                }
            }
        }
    }
  }

  const youtubeProxy = proxyquire('../../../lib/services/youtube', { 'googleapis': { google: pathStub }})
  const yt = new youtubeProxy(config);

  it('Gets a Channels Uploaded Playlist Id', function () {

    return yt.getChannelsUploadedPlaylistId(config.YOUTUBE_CHANNEL)
    .then(function (response) {
        return assert.equal(response, "UU554eY5jNUfDq3yDOJYirOQ");
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
        return assert.deepStrictEqual(response, { isLive: true, viewers: '1785', started: moment('2020-10-10T19:04:28Z', 'YYYY-MM-DDTHH:mm:ssZ') });
    });
  });

  it('Gets live broadcast concurrent viewers count when offline', function() {
    return yt.getChannelStatus()
    .then(function (response) {
        return assert.deepStrictEqual(response, { isLive: false });
    });
  });

});
