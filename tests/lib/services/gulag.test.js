const assert = require('assert');
const gulagService = require('../../../lib/services/gulag');

describe('Gulag tests ', () => {
  it('parses input without time correctly', function() {
    const input = '1231sm skykanin bobby alice cake linusred memelord';
    const parsedInput = gulagService.parseInput(input, 600);
    assert.deepStrictEqual(parsedInput, {
      isPermanent: false,
      parsedDuration: 600,
      muteString: '10m',
      users: ['1231sm', 'skykanin', 'bobby', 'alice', 'cake', 'linusred', 'memelord'],
    });
  });
  it('parses input with time correctly', function() {
    const input = '30m skykanin bobby alice cake linusred memelord';
    const parsedInput = gulagService.parseInput(input, 600);
    assert.deepStrictEqual(parsedInput, {
      isPermanent: false,
      parsedDuration: 1800,
      muteString: '30m',
      users: ['skykanin', 'bobby', 'alice', 'cake', 'linusred', 'memelord'],
    });
  });
  it('parses input with perm correctly', function() {
    const input = 'perm skykanin bobby alice cake linusred memelord';
    const parsedInput = gulagService.parseInput(input, 600);
    assert.deepStrictEqual(parsedInput, {
      isPermanent: true,
      parsedDuration: 0,
      muteString: 'PERMANENTLY',
      users: ['skykanin', 'bobby', 'alice', 'cake', 'linusred', 'memelord'],
    });
  });
});
