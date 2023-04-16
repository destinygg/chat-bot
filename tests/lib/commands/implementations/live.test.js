const _ = require('lodash');
const live = require('../../../../lib/commands/implementations/live');
const CommandOutput = require('../../../../lib/commands/command-output');
const assert = require('assert');
const streamInfoOffline = require('./mocks/stream-info-offline.json');

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
    const expected = new CommandOutput(null, `Stream was last online 1s ago. Time Streamed: 10s.`);
    return live.work(null, buildMockServices(streamInfoOffline)).then((response) => {
      assert.deepStrictEqual(response, expected);
    });
  });
});
