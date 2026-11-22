const { mutelinks } = require('../../../../lib/commands/implementations/mutelinks');
const CommandOutput = require('../../../../lib/commands/command-output');
const assert = require('assert');
const ModerationState = require('../../../../lib/services/moderation-state');

describe('Mutelinks command', () => {
  beforeEach(function () {
    this.published = [];
    this.moderationState = new ModerationState();
    this.moderationState.setPublisher((event, payload) => {
      this.published.push({ event, payload });
    });
    this.mockServices = {
      moderationState: this.moderationState,
      messageMatching: {},
      punishmentStream: {
        write: () => {},
      },
      logger: {
        info: () => {},
        warn: () => {},
        error: () => {},
      },
    };
    this.mutelinks = mutelinks(60);
  });

  it('turns "all" mode on with the default duration and then off', function () {
    const output1 = this.mutelinks.work('all', this.mockServices);
    assert.deepStrictEqual(
      output1,
      new CommandOutput(null, 'Link muting (1m) turned on for all links'),
    );
    assert.deepStrictEqual(this.moderationState.mutelinks, {
      mode: 'all',
      duration: 60,
      changedBy: '',
      timestamp: this.moderationState.mutelinks.timestamp,
    });

    const output2 = this.mutelinks.work('off', this.mockServices);
    assert.deepStrictEqual(output2, new CommandOutput(null, 'Link muting turned off'));
    assert.strictEqual(this.moderationState.mutelinks.mode, 'off');
    assert.deepStrictEqual(
      this.published.map((event) => event.event),
      ['MUTELINKS', 'MUTELINKS'],
    );
    assert.deepStrictEqual(this.published[0].payload, {
      mode: 'all',
      duration: 60,
      by: '',
    });
  });

  it('turns "on" mode on for the moderator with a custom duration', function () {
    const output = this.mutelinks.work('on 20m', this.mockServices, { user: 'deStInY' });

    assert.deepStrictEqual(
      output,
      new CommandOutput(null, 'Link muting (20m) turned on for mentioning deStInY'),
    );
    assert.strictEqual(this.moderationState.mutelinks.mode, 'on');
    assert.strictEqual(this.moderationState.mutelinks.duration, 1200);
    assert.strictEqual(this.moderationState.mutelinks.mention, 'deStInY');
    assert.deepStrictEqual(this.published[0].payload, {
      mode: 'on',
      duration: 1200,
      by: 'deStInY',
    });
  });

  it('formats duplicate commands using the active state', function () {
    const output1 = this.mutelinks.work('on', this.mockServices, { user: 'deStInY' });
    assert.deepStrictEqual(
      output1,
      new CommandOutput(null, 'Link muting (1m) turned on for mentioning deStInY'),
    );
    const output2 = this.mutelinks.work('on 1m', this.mockServices, { user: 'deStInY' });
    assert.deepStrictEqual(
      output2,
      new CommandOutput(null, 'Link muting (1m) is already on for mentioning deStInY'),
    );
    const output3 = this.mutelinks.work('on 20m', this.mockServices, { user: 'deStInY' });
    assert.deepStrictEqual(
      output3,
      new CommandOutput(null, 'Link muting (20m) turned on for mentioning deStInY'),
    );
    const output4 = this.mutelinks.work('all 20m', this.mockServices, { user: 'deStInY' });
    assert.deepStrictEqual(
      output4,
      new CommandOutput(null, 'Link muting (20m) turned on for all links'),
    );
  });

  it('normalizes "repeated" to the repeat mode', function () {
    const output = this.mutelinks.work('repeated 15m', this.mockServices);

    assert.deepStrictEqual(output, new CommandOutput(null, 'Link muting (15m) turned repeat'));
    assert.strictEqual(this.moderationState.mutelinks.mode, 'repeat');
    assert.deepStrictEqual(this.published[0].payload, {
      mode: 'repeat',
      duration: 900,
      by: '',
    });
  });

  it('alerts when link muting is already off', function () {
    this.mutelinks.work('off', this.mockServices);
    const output = this.mutelinks.work('off', this.mockServices);

    assert.deepStrictEqual(output, new CommandOutput(null, 'Link muting (1m) is already off'));
    assert.strictEqual(this.moderationState.mutelinks.mode, 'off');
  });
});
