const assert = require('assert');
const sinon = require('sinon');
const mute = require('../../../../lib/commands/implementations/mute');

describe('Mute command', () => {
  beforeEach(() => {
    this.mockServices = {
      punishmentStream: {
        write: sinon.spy(),
      },
    };
  });

  it('mutes a user with duration and no reason', () => {
    mute.work('10m TestUser', this.mockServices);
    assert(this.mockServices.punishmentStream.write.calledOnce);
    const call = this.mockServices.punishmentStream.write.firstCall.args[0];
    assert.strictEqual(call.user, 'testuser');
    assert.strictEqual(call.duration, 600);
    assert.strictEqual(call.type, 'mute');
    assert(call.reason.includes('Muting: testuser for'));
    assert(!call.reason.includes('Reason:'));
  });

  it('mutes a user with duration and reason', () => {
    mute.work('10m TestUser being annoying', this.mockServices);
    assert(this.mockServices.punishmentStream.write.calledOnce);
    const call = this.mockServices.punishmentStream.write.firstCall.args[0];
    assert.strictEqual(call.user, 'testuser');
    assert.strictEqual(call.duration, 600);
    assert.strictEqual(call.type, 'mute');
    assert(call.reason.includes('Reason: being annoying'));
  });

  it('mutes a user with default duration when none provided', () => {
    mute.work('TestUser', this.mockServices);
    assert(this.mockServices.punishmentStream.write.calledOnce);
    const call = this.mockServices.punishmentStream.write.firstCall.args[0];
    assert.strictEqual(call.user, 'testuser');
    assert.strictEqual(call.duration, 600);
    assert.strictEqual(call.type, 'mute');
  });

  it('mutes a user with default duration and reason', () => {
    mute.work('TestUser spamming links', this.mockServices);
    assert(this.mockServices.punishmentStream.write.calledOnce);
    const call = this.mockServices.punishmentStream.write.firstCall.args[0];
    assert.strictEqual(call.user, 'testuser');
    assert(call.reason.includes('Reason: spamming links'));
  });
});
