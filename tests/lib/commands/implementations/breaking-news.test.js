const assert = require('assert');

const { breakingNews } = require('../../../../lib/commands/implementations/breaking-news');
const CommandOutput = require('../../../../lib/commands/command-output');
const ModerationState = require('../../../../lib/services/moderation-state');

describe('Breaking news command', () => {
  beforeEach(function () {
    this.published = [];
    this.moderationState = new ModerationState();
    this.moderationState.setPublisher((event, payload) => {
      this.published.push({ event, payload });
    });
    this.mockServices = {
      moderationState: this.moderationState,
    };
  });

  it('formats mode changes and alerts of duplicate commands', function () {
    const output1 = breakingNews.work('on', this.mockServices, { user: 'deStInY' });
    assert.deepStrictEqual(
      output1,
      new CommandOutput(null, 'Breaking news mode (5m) turned on for mentioning deStInY'),
    );
    const output2 = breakingNews.work('on 5m', this.mockServices, { user: 'deStInY' });
    assert.deepStrictEqual(
      output2,
      new CommandOutput(null, 'Breaking news mode (5m) is already on for mentioning deStInY'),
    );
    const output3 = breakingNews.work('on 20m', this.mockServices, { user: 'deStInY' });
    assert.deepStrictEqual(
      output3,
      new CommandOutput(null, 'Breaking news mode (20m) turned on for mentioning deStInY'),
    );
    const output4 = breakingNews.work('all 20m', this.mockServices);
    assert.deepStrictEqual(
      output4,
      new CommandOutput(null, 'Breaking news mode (20m) turned on for all links'),
    );
  });

  it('publishes breaking news state and clears the mention outside "on" mode', function () {
    breakingNews.work('on 10m', this.mockServices, { user: 'deStInY' });
    assert.deepStrictEqual(this.moderationState.breakingnews, {
      mode: 'on',
      maxAge: 600,
      changedBy: 'deStInY',
      mention: 'deStInY',
      timestamp: this.moderationState.breakingnews.timestamp,
    });

    const output = breakingNews.work('off', this.mockServices);
    assert.deepStrictEqual(output, new CommandOutput(null, 'Breaking news mode turned off'));
    assert.strictEqual(this.moderationState.breakingnews.mode, 'off');
    assert.strictEqual(this.moderationState.breakingnews.mention, undefined);
    assert.deepStrictEqual(
      this.published.map((event) => event.event),
      ['BREAKINGNEWS', 'BREAKINGNEWS'],
    );
    assert.deepStrictEqual(this.published[0].payload, {
      mode: 'on',
      maxAge: 600,
      by: 'deStInY',
    });
  });

  it('alerts when breaking news mode is already off', function () {
    breakingNews.work('off', this.mockServices);
    const output = breakingNews.work('off', this.mockServices);

    assert.deepStrictEqual(
      output,
      new CommandOutput(null, 'Breaking news mode (5m) is already off'),
    );
  });
});
