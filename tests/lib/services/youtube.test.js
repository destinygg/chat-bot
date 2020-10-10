const assert = require('assert');
const sinon = require('sinon');
const proxyquire  = require('proxyquire').noCallThru();
const mockResponses = require('./mocks/youtube-responses.json')

describe('Youtube Tests', () => {

  const config = {
      YOUTUBE_API_KEY: 'TEST123',
      YOUTUBE_CHANNEL: 'Destiny'
  };

  const pathStub = function(){
  }
  pathStub.youtube = function(config){
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
                return Promise.resolve({
                    //data: mockResponses.getActiveLiveBroadcastsVideoIdOffline
                    data: mockResponses.getActiveLiveBroadcastsVideoId
                })
            }
        },
        videos: {
            list: function(){
                return Promise.resolve({
                    //data: mockResponses.getConcurrentViewersOffline
                    data: mockResponses.getConcurrentViewers
                })
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
        //return assert.strictEqual(response, null);
        return assert.strictEqual(response, 'qif_XUayrWY');
    });
  });

  it('Gets live broadcast concurrent viewers count', function() {
    return yt.getConcurrentViewers()
    .then(function (response) {
        //return assert.strictEqual(response, null);
        return assert.strictEqual(response, '1785');
    });
  });

});
