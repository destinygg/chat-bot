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
                return Promise.resolve({
                    data: mockResponses.getChannelsUploadedPlaylistId
                })
            }
        },
        playlistItems: {
            list: function(){
                return Promise.resolve({
                    data: mockResponses.getListOfUploadedVideos
                });
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

});
