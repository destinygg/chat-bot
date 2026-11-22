const assert = require('assert');
const sinon = require('sinon');
const Logger = require('bunyan');

const { nuke, megaNuke } = require('../../../../lib/commands/implementations/nuke');
const ModerationState = require('../../../../lib/services/moderation-state');
const RollingChatCache = require('../../../../lib/services/dgg-rolling-chat-cache');
const SpamDetection = require('../../../../lib/services/spam-detection');
const messageMatching = require('../../../../lib/services/message-matching');
const { makeMute, makeBan } = require('../../../../lib/chat-utils/punishment-helpers');

function createServices() {
  const logger = sinon.createStubInstance(Logger);
  const services = {
    logger,
    messageMatching,
    punishmentStream: { write: sinon.spy() },
    moderationState: new ModerationState(),
  };
  services.chatCache = new RollingChatCache({ maxMessagesInList: 100 }, services);
  services.spamDetection = new SpamDetection({ nukeDepth: 100 }, services);
  return services;
}

describe('Nuke command', () => {
  beforeEach(function () {
    this.clock = sinon.useFakeTimers({ now: 1770000000000 });
    this.services = createServices();
  });

  afterEach(function () {
    this.clock.restore();
  });

  it('nukes recent matching messages and stores victims with ids', function () {
    const services = this.services;
    const published = [];
    services.moderationState.setPublisher((event, payload) => published.push({ event, payload }));
    services.chatCache.addMessageToRunningList('Old', 3, 'KING MOUTON');

    this.clock.tick(61000);
    services.chatCache.addMessageToRunningList('Chatter', 1, 'the KING MOUTON arrives');
    services.chatCache.addMessageToRunningList('Other', 2, 'king mouton is here');
    services.chatCache.addMessageToRunningList('Mod', 99, 'KING MOUTON');

    const output = nuke.work('KING MOUTON', services, { user: 'Mod', id: 99 });

    assert.strictEqual(output.output, 'Dropping the NUKE on 2 victims');
    assert.deepStrictEqual(published, [
      {
        event: 'NUKE',
        payload: {
          phrase: 'KING MOUTON',
          regex: false,
          duration: 600,
          linger: 300,
          mega: false,
          by: 'Mod',
          victims: [
            { id: 2, nick: 'Other' },
            { id: 1, nick: 'Chatter' },
          ],
        },
      },
    ]);
    assert.deepStrictEqual(
      services.moderationState.getNukes().map((storedNuke) => ({
        key: storedNuke.key,
        phrase: storedNuke.phrase,
        duration: storedNuke.duration,
        mega: storedNuke.mega,
      })),
      [
        {
          key: 'plain:king mouton',
          phrase: 'KING MOUTON',
          duration: 600,
          mega: false,
        },
      ],
    );
    assert.deepStrictEqual(
      services.moderationState.getNukedUsers().map((victim) => [victim.id, victim.nick]),
      [
        [2, 'Other'],
        [1, 'Chatter'],
      ],
    );
    assert.deepStrictEqual(
      services.punishmentStream.write.getCalls().map((call) => call.args[0]),
      [makeMute('Other', 600, false), makeMute('Chatter', 600, false)],
    );
  });

  it('nukes regex phrases as mega nukes with bans', function () {
    const services = this.services;
    services.chatCache.addMessageToRunningList('Chatter', 1, 'what a NUKE lol');

    const output = megaNuke.work('1h /n.+ke/', services, { user: 'Mod', id: 99 });

    assert.strictEqual(output.output, 'Dropping the NUKE on 1 victims');
    const [storedNuke] = services.moderationState.getNukes();
    assert.strictEqual(storedNuke.key, 'regex:n.+ke');
    assert.strictEqual(storedNuke.phrase, 'n.+ke');
    assert.strictEqual(storedNuke.regex, true);
    assert.strictEqual(storedNuke.duration, 3600);
    assert.strictEqual(storedNuke.mega, true);

    const punishment = services.punishmentStream.write.getCall(0).args[0];
    assert.deepStrictEqual(
      punishment,
      makeBan('Chatter', 3600, true, false, 'MEGA NUKED by Mod', false, true),
    );
  });
});
