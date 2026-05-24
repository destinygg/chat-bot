const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const mockResponses = require('./mocks/dgg-api-responses.json');

describe('DggApi Tests', () => {
  const config = { baseUrl: 'https://www.destiny.gg' };

  let axiosGet;
  let DggApi;
  let dggApi;

  beforeEach(function () {
    axiosGet = sinon.stub();
    DggApi = proxyquire('../../../lib/services/dgg-api', {
      axios: { default: { get: axiosGet } },
    });
    dggApi = new DggApi(config);
  });

  it('Gets the channel\'s uploaded videos', function () {
    axiosGet.withArgs(`${config.baseUrl}/api/info/videos`).resolves({ data: mockResponses.videos });
    return dggApi.getListOfUploadedVideos().then((response) => {
      assert.deepStrictEqual(response, mockResponses.videos.data);
    });
  });

  it('Gets the latest uploaded video', function () {
    axiosGet.withArgs(`${config.baseUrl}/api/info/videos`).resolves({ data: mockResponses.videos });
    return dggApi.getLatestUploadedVideo().then((response) => {
      assert.deepStrictEqual(response, mockResponses.videos.data[0]);
    });
  });
});
