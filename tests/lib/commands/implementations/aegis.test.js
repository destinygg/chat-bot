const assert = require('assert');
const sinon = require('sinon');

const { aegis, aegisSingle, getNukes } = require('../../../../lib/commands/implementations/aegis');
const ModerationState = require('../../../../lib/services/moderation-state');
const { makeUnban } = require('../../../../lib/chat-utils/punishment-helpers');

function createServices() {
  const services = {
    moderationState: new ModerationState(),
    punishmentStream: { write: sinon.spy() },
  };
  return services;
}

describe('Aegis commands', () => {
  beforeEach(function () {
    this.clock = sinon.useFakeTimers({ now: 1770000000000 });
    this.services = createServices();
  });

  afterEach(function () {
    this.clock.restore();
  });

  it('reports when there is no stored nuke', function () {
    const output = aegis.work('', this.services);

    assert.strictEqual(output.output, 'Hmmm. Did not find a stored nuke.');
    assert.strictEqual(this.services.punishmentStream.write.callCount, 0);
  });

  it('unmutes every nuked user and clears all nukes', function () {
    const services = this.services;
    services.moderationState.addNuke({
      phrase: 'one',
      duration: 600,
      victims: [
        { id: 1, nick: 'First' },
        { id: 2, nick: 'Second' },
      ],
    });
    services.moderationState.addNuke({ phrase: 'two', duration: 600 });

    const output = aegis.work('', services);

    assert.strictEqual(output.output, 'Removing nuked phrases! Unmuting 2 users AngelThump');
    assert.deepStrictEqual(
      services.punishmentStream.write.getCalls().map((call) => call.args[0]),
      [makeUnban('First', false), makeUnban('Second', false)],
    );
    assert.deepStrictEqual(services.moderationState.getNukes(), []);
    assert.deepStrictEqual(services.moderationState.getNukedUsers(), []);
  });

  it('unmutes victims hydrated from a STATES snapshot and publishes the removal', function () {
    const services = this.services;
    const published = [];
    services.moderationState.setPublisher((event, payload) => published.push({ event, payload }));
    services.moderationState.applySnapshot({
      nukes: [
        {
          key: 'plain:test',
          phrase: 'test',
          regex: false,
          duration: 600,
          mega: false,
          addedBy: 'Mod',
          addedAt: 1770000000000,
          expiresAt: 1770000300000,
        },
      ],
      nukedUsers: [
        {
          id: 1,
          nick: 'HydratedUser',
          nukeKey: 'plain:test',
          mega: false,
          expiresAt: 1770000600000,
        },
      ],
    });

    const output = aegis.work('', services);

    assert.strictEqual(output.output, 'Removing nuked phrases! Unmuting 1 users AngelThump');
    assert.deepStrictEqual(
      services.punishmentStream.write.getCalls().map((call) => call.args[0]),
      [makeUnban('HydratedUser', false)],
    );
    assert.deepStrictEqual(published[published.length - 1], {
      event: 'REMOVENUKE',
      payload: { phrase: '', regex: false, clearVictims: true },
    });
  });

  it('removes a single nuke and unmutes only its victims', function () {
    const services = this.services;
    services.moderationState.addNuke({
      phrase: 'one',
      duration: 600,
      victims: [{ id: 1, nick: 'First' }],
    });
    services.moderationState.addNuke({
      phrase: 'two',
      duration: 600,
      victims: [{ id: 2, nick: 'Second' }],
    });

    const output = aegisSingle.work('one', services);

    assert.strictEqual(
      output.output,
      'Removing nuked phrase "/\\bone\\b/i"! Unmuting 1 users AngelThump',
    );
    assert.deepStrictEqual(
      services.punishmentStream.write.getCalls().map((call) => call.args[0]),
      [makeUnban('First', false)],
    );
    assert.deepStrictEqual(
      services.moderationState.getNukes().map((storedNuke) => storedNuke.phrase),
      ['two'],
    );
    assert.deepStrictEqual(
      services.moderationState.getNukedUsers().map((victim) => victim.nick),
      ['Second'],
    );
  });

  it('removes regex nukes by pattern', function () {
    const services = this.services;
    services.moderationState.addNuke({
      phrase: 'k.+g',
      regex: true,
      duration: 600,
      victims: [{ id: 1, nick: 'First' }],
    });

    const output = aegisSingle.work('/k.+g/', services);

    assert.strictEqual(
      output.output,
      'Removing nuked phrase "/k.+g/i"! Unmuting 1 users AngelThump',
    );
    assert.deepStrictEqual(services.moderationState.getNukes(), []);
  });

  it('does not report unmuted users when the phrase has none', function () {
    const services = this.services;
    services.moderationState.addNuke({ phrase: 'one', duration: 600 });

    const output = aegisSingle.work('one', services);

    assert.strictEqual(output.output, 'Removed phrase (unless it didnt exist, then I did nothing');
    assert.deepStrictEqual(services.moderationState.getNukes(), []);
  });

  it('lists active nukes', function () {
    const services = this.services;
    services.moderationState.addNuke({ phrase: 'one', duration: 600 });
    services.moderationState.addNuke({ phrase: 'k.+g', regex: true, duration: 600 });

    const output = getNukes.work('', services);

    assert.strictEqual(output.output, 'List of nuked phrases: one, /k.+g/');
  });
});
