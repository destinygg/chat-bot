const _ = require('lodash');
const live = require('../../../../lib/commands/implementations/live');
const CommandOutput = require('../../../../lib/commands/command-output');
const assert = require('assert');
const streamInfoOffline = require('./mocks/stream-info-offline.json');
const streamInfoOfflineNull = require('./mocks/stream-info-offline-null.json');
const streamInfoOnline = require('./mocks/stream-info-online.json');

describe('!live Test', () => {
  const buildMockServices = (dggApiResponse) => {
    return {
      dggApi: {
        getStreamInfo: () => {
          return Promise.resolve(_.values(dggApiResponse.data.streams));
        },
      },
    };
  };

  it('responds correctly when stream is offline', function () {
    const expected = new CommandOutput(
      null,
      `Stream was last online 2 days 11h ago. Time Streamed: 4h 35m.`,
    );
    return live.work(null, buildMockServices(streamInfoOffline)).then((response) => {
      assert.deepStrictEqual(response, expected);
    });
  });

  it('responds correctly when all streams are null', function () {
    const expected = new CommandOutput(null, 'Stream is offline.');
    return live.work(null, buildMockServices(streamInfoOfflineNull)).then((response) => {
      assert.deepStrictEqual(response, expected);
    });
  });

  it('responds with start time of oldest stream and cumulative viewers', function () {
    const expected = new CommandOutput(null, `Viewers: 17018. Stream live as of 2 days 16h ago.`);
    return live.work(null, buildMockServices(streamInfoOnline)).then((response) => {
      assert.deepStrictEqual(response, expected);
    });
  });
});
