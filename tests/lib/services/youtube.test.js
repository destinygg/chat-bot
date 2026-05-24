const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const moment = require('moment');
const mockResponses = require('./mocks/youtube-responses.json');

describe('Youtube Tests', () => {
  const config = { baseUrl: 'https://www.destiny.gg' };

  let axiosGet;
  let YouTube;
  let yt;

  beforeEach(function () {
    this.clock = sinon.useFakeTimers(1603155310586);
    axiosGet = sinon.stub();
    YouTube = proxyquire('../../../lib/services/youtube', {
      axios: { default: { get: axiosGet } },
    });
    yt = new YouTube(config);
  });

  afterEach(function () {
    this.clock.restore();
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

  it('Gets the live broadcast video id when live', function () {
    axiosGet
      .withArgs(`${config.baseUrl}/api/info/stream`)
      .resolves({ data: mockResponses.streamLive });
    return yt.getActiveLiveBroadcastsVideoId().then((response) => {
      assert.strictEqual(response, 'qif_XUayrWY');
    });
  });

  it('Gets the live broadcast video id as null when offline', function () {
    axiosGet
      .withArgs(`${config.baseUrl}/api/info/stream`)
      .resolves({ data: mockResponses.streamOffline });
    return yt.getActiveLiveBroadcastsVideoId().then((response) => {
      assert.strictEqual(response, null);
    });
  });

  it('Gets the live broadcast video id as null when youtube stream is missing', function () {
    axiosGet
      .withArgs(`${config.baseUrl}/api/info/stream`)
      .resolves({ data: mockResponses.streamNoYoutube });
    return yt.getActiveLiveBroadcastsVideoId().then((response) => {
      assert.strictEqual(response, null);
    });
  });

  it('Gets channel status with viewers when live', function () {
    axiosGet
      .withArgs(`${config.baseUrl}/api/info/stream`)
      .resolves({ data: mockResponses.streamLive });
    return yt.getChannelStatus().then((response) => {
      assert.deepStrictEqual(response, {
        timestamp: 1603155310,
        isLive: true,
        viewers: 1785,
        started: moment('2020-10-10T19:04:28Z', 'YYYY-MM-DDTHH:mm:ssZ'),
      });
    });
  });

  it('Gets channel status as offline when not live', function () {
    axiosGet
      .withArgs(`${config.baseUrl}/api/info/stream`)
      .resolves({ data: mockResponses.streamOffline });
    return yt.getChannelStatus().then((response) => {
      assert.deepStrictEqual(response, { timestamp: 1603155310, isLive: false });
    });
  });

  it('Gets channel status as offline when youtube stream is missing', function () {
    axiosGet
      .withArgs(`${config.baseUrl}/api/info/stream`)
      .resolves({ data: mockResponses.streamNoYoutube });
    return yt.getChannelStatus().then((response) => {
      assert.deepStrictEqual(response, { timestamp: 1603155310, isLive: false });
    });
  });
});
