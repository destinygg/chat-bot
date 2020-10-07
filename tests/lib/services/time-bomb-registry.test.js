const assert = require('assert');
const TimeBombRegistry = require('../../../lib/services/time-bomb-registry');
const sinon = require('sinon');

describe('Time Bomb tests', () => {
  beforeEach(function () {
    this.clock = sinon.useFakeTimers();
    this.registry = new TimeBombRegistry({
      defaultBombDelaySeconds: 60,
    });
  });

  afterEach(function () {
    this.clock.restore();
  });

  it('arms and blows up a time bomb on a user', function() {
    const user = 'jabelonske';
    const delay = 30;  // in seconds
    let boom = false;

    this.registry.arm(() => {
      boom = true;
    }, user, delay);
    assert.ok(this.registry.hasBomb(user), 'bomb not added correctly');

    this.clock.tick((delay + 1)*1000);

    assert.ok(boom, 'bomb callback not called');
    assert.ok(!this.registry.hasBomb(user), 'bomb not removed from registry');
  });

  it('arms and defuses a time bomb on a user', function() {
    const user = 'jabelonske';
    const delay = 30;  // in seconds
    let boom = false;

    this.registry.arm(() => {
      boom = true;
    }, user, delay);
    assert.ok(this.registry.hasBomb(user), 'bomb not added correctly');

    this.clock.tick((delay/2)*1000);

    this.registry.defuse(user);
    assert.ok(!this.registry.hasBomb(user), 'bomb not defused correctly');

    this.clock.tick((delay/2 + 1)*1000);

    assert.ok(!boom, 'bomb callback called');
  });

  it('arms multiple time bombs and defuses all', function() {
    const users = {
      'jabelonske': false, 
      'cake': false, 
      'linusred': false,
    };
    const delay = 30;  // in seconds

    Object.keys(users).forEach(user => {
      this.registry.arm(() => {
        users[user] = true;
      }, user, delay);
    });

    this.clock.tick((delay/2)*1000);

    this.registry.defuseAll();
    
    this.clock.tick((delay/2 + 1)*1000);

    Object.entries(users).forEach(([user, boom]) => {
      assert.ok(!boom, 'bomb callback called');
      assert.ok(!this.registry.hasBomb(user), 'bomb not removed from registry');
    });
  });
});
