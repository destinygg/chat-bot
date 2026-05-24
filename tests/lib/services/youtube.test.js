const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const mockResponses = require('./mocks/youtube-responses.json');

describe('Youtube Tests', () => {
  const config = { baseUrl: 'https://www.destiny.gg' };

  let axiosGet;
  let YouTube;
  let yt;

  beforeEach(function () {
    axiosGet = sinon.stub();
    YouTube = proxyquire('../../../lib/services/youtube', {
      axios: { default: { get: axiosGet } },
    });
    yt = new YouTube(config);
  });

  it('Gets the channel\'s uploaded videos', function () {
    axiosGet.withArgs(`${config.baseUrl}/api/info/videos`).resolves({ data: mockResponses.videos });
    return yt.getListOfUploadedVideos().then((response) => {
      assert.deepStrictEqual(response, mockResponses.videos.data);
    });
  });

  it('Gets the latest uploaded video', function () {
    axiosGet.withArgs(`${config.baseUrl}/api/info/videos`).resolves({ data: mockResponses.videos });
    return yt.getLatestUploadedVideo().then((response) => {
      assert.deepStrictEqual(response, mockResponses.videos.data[0]);
    });
  });
});
