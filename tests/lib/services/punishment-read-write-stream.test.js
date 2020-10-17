const assert = require('assert');
const PunishmentCache = require('../../../../lib/services/punishment-cache.js');
const PunishmentReadWriteStream = require('../../../../lib/services/punishment-read-write-stream.js');

describe('Mute capping tests', () => {
  beforeEach(function() {
    this.mockServices = {
      punishmentCache: new PunishmentCache({maxMuteSeconds: 100}),
    };
  });

  it('limits mute duration to non-negative numbers', function() {
    const punishmentReadWriteStream = new PunishmentReadWriteStream(this.mockServices);
    punishmentReadWriteStream.sendMute('mute', -10, 'mute', 'tommy');
    assert.deepStrictEqual(0, punishmentReadWriteStream.read().duration);
  });

  it('does not change the duration when the input duration is exactly 0', function() {
    const punishmentReadWriteStream = new PunishmentReadWriteStream(this.mockServices);
    punishmentReadWriteStream.sendMute('mute', 0, 'mute', 'tommy');
    assert.deepStrictEqual(0, punishmentReadWriteStream.read().duration);
  });

  it('does not change the duration when the input duration is between 0 and maxMuteDurationSeconds', function() {
    const punishmentReadWriteStream = new PunishmentReadWriteStream(this.mockServices);
    punishmentReadWriteStream.sendMute('mute', 10, 'mute', 'tommy');
    assert.deepStrictEqual(10, punishmentReadWriteStream.read().duration);
  });

  it('does not change the duration when the input duration is exactly maxMuteDurationSeconds', function() {
    const punishmentReadWriteStream = new PunishmentReadWriteStream(this.mockServices);
    punishmentReadWriteStream.sendMute('mute', 100, 'mute', 'tommy');
    assert.deepStrictEqual(100, punishmentReadWriteStream.read().duration);
  });

  it('caps mute duration to maxMuteDurationSeconds', function() {
    const punishmentReadWriteStream = new PunishmentReadWriteStream(this.mockServices);
    punishmentReadWriteStream.sendMute('mute', 200, 'mute', 'tommy');
    assert.deepStrictEqual(100, punishmentReadWriteStream.read().duration);
  });

  it('throws a TypeError if the mute duration is a string', function() {
    const punishmentReadWriteStream = new PunishmentReadWriteStream(this.mockServices);
    punishmentReadWriteStream.sendMute('mute', 'OOO', 'mute', 'tommy');
    assert.throws(() => {punishmentReadWriteStream.sendMute().read(), TypeError});
  });
});
