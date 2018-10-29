const assert = require('assert');
const PunishmentCache = require('../../../lib/services/punishment-cache');
const sinon = require('sinon');

describe('Punishment tests ', () => {
  beforeEach(function () {
    this.clock = sinon.useFakeTimers();
  });

  afterEach(function () {
    this.clock.restore();
  });

  it('adds a user to the cache with the default mute duration', function() {
    const punishmentCache = new PunishmentCache({baseMuteSeconds: 10});

    const duration = punishmentCache.getAndAddPunishmentDuration('skyrt');
    assert.deepStrictEqual(duration, 10);
  });


  it('adds a user to the cache with a set mute duration', function() {
    const punishmentCache = new PunishmentCache({baseMuteSeconds: 10});

    const duration = punishmentCache.getAndAddPunishmentDuration('skyrt', 600);
    assert.deepStrictEqual(duration, 600);
  });


  it('grows the mute punishment by the muteGrowthMultiplier', function() {
    const punishmentCache = new PunishmentCache({baseMuteSeconds: 10, muteGrowthMultiplier: 2});

    punishmentCache.getAndAddPunishmentDuration('skyrt');
    const duration = punishmentCache.getAndAddPunishmentDuration('skyrt');
    assert.deepStrictEqual(duration, 20);
  });

  it('deletes data after the tombstone duration is passed', function() {
    const punishmentCache = new PunishmentCache({baseMuteSeconds: 10, muteGrowthMultiplier: 2,
      timeToLiveSeconds: 5, tomeStoneIntervalMilliseconds: 10000 });

    let duration= punishmentCache.getAndAddPunishmentDuration('skyrt');
    assert.deepStrictEqual(duration, 10);
    duration = punishmentCache.getAndAddPunishmentDuration('skyrt');
    assert.deepStrictEqual(duration, 20);
    this.clock.tick(11000);
    duration = punishmentCache.getAndAddPunishmentDuration('skyrt');

    assert.deepStrictEqual(duration, 10);
  });
});

