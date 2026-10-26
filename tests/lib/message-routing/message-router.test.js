const assert = require('assert');
const sinon = require('sinon');

const MessageRouter = require('../../../lib/message-routing/message-router');
const MessageRelay = require('../../../lib/services/message-relay');
const ModerationState = require('../../../lib/services/moderation-state');
const messageMatching = require('../../../lib/services/message-matching');
const { makeMute, makeBan } = require('../../../lib/chat-utils/punishment-helpers');

function createRouter(overrides = {}) {
  const services = {
    logger: {
      info: () => {},
      warn: () => {},
      error: () => {},
    },
    chatCache: {
      runningMessageList: [],
      addMessageToRunningList: sinon.spy(),
      addMessageToCache: sinon.spy(),
      diffNewMessageForUser: sinon.stub().returns(0),
      getViewerUrlList: sinon.stub().returns([]),
      isPastRateLimit: sinon.stub().returns(false),
      getRecentUrls: sinon.stub().returns([]),
      messageUrlSpamUser: null,
    },
    punishmentCache: {},
    punishmentStream: { write: sinon.spy() },
    spamDetection: {
      asciiSpamCheck: sinon.stub().returns(false),
      isSimilarityAboveThreshold: sinon.stub().returns(false),
      checkListOfMessagesForSpam: sinon.stub().returns(false),
      uniqueWordsCheck: sinon.stub().returns(false),
      longRepeatedPhrase: sinon.stub().returns(false),
      checkListOfRecentUrlsForSpam: sinon.stub().returns(false),
      checkAgainstBannedPhrases: sinon.stub().returns(false),
    },
    roleCache: { addUserRoles: sinon.spy() },
    messageRelay: new MessageRelay(),
    moderationState: new ModerationState(),
    messageMatching,
    twitterApi: {},
    htmlMetadata: {},
    ...overrides,
  };
  const router = new MessageRouter({ chatConnectedTo: 'dgg' }, services);
  return { router, services };
}

describe('MessageRouter moderation', () => {
  beforeEach(function () {
    this.clock = sinon.useFakeTimers({ now: 1770000000000 });
  });

  afterEach(function () {
    this.clock.restore();
  });

  it('mutes matching nuke messages and records the victim id', function () {
    const { router, services } = createRouter();
    const published = [];
    services.moderationState.addNuke({ phrase: 'test phrase', duration: 600 });
    services.moderationState.setPublisher((event, payload) => published.push({ event, payload }));

    router.routeIncomingMessages({
      user: 'Chatter',
      id: 123,
      roles: [],
      message: 'a TEST PHRASE appears',
    });

    assert.deepStrictEqual(published, [
      {
        event: 'NUKEVICTIM',
        payload: {
          phrase: 'test phrase',
          regex: false,
          victims: [{ id: 123, nick: 'Chatter' }],
        },
      },
    ]);

    assert.deepStrictEqual(
      services.moderationState.getNukedUsers().map((victim) => [victim.id, victim.nick]),
      [[123, 'Chatter']],
    );
    assert.deepStrictEqual(
      services.punishmentStream.write.getCall(0).args[0],
      makeMute(
        'Chatter',
        600,
        `Chatter
       muted for 10m for using a recently nuked phrase (test phrase).`,
      ),
    );
    assert.deepStrictEqual(services.chatCache.addMessageToRunningList.getCall(0).args, [
      'Chatter',
      123,
      'a TEST PHRASE appears',
    ]);
  });

  it('bans matching mega nuke messages and records the victim id', function () {
    const { router, services } = createRouter();
    services.moderationState.addNuke({ phrase: 'test phrase', duration: 600, mega: true });

    router.routeIncomingMessages({
      user: 'Chatter',
      id: 123,
      roles: [],
      message: 'test phrase',
    });

    assert.deepStrictEqual(
      services.punishmentStream.write.getCall(0).args[0],
      makeBan(
        'Chatter',
        600,
        true,
        false,
        `Chatter
       BANNED for 10m for using a recently MEGA NUKED phrase (test phrase).`,
      ),
    );
  });

  it('does not punish protected users but still caches their messages', function () {
    const { router, services } = createRouter();
    services.moderationState.addNuke({ phrase: 'test phrase', duration: 600 });

    router.routeIncomingMessages({
      user: 'Protected',
      id: 10,
      roles: ['PROTECTED'],
      message: 'test phrase',
    });

    assert.strictEqual(services.punishmentStream.write.callCount, 0);
    assert.deepStrictEqual(services.moderationState.getNukedUsers(), []);
    assert.deepStrictEqual(services.chatCache.addMessageToRunningList.getCall(0).args, [
      'Protected',
      10,
      'test phrase',
    ]);
  });

  it('mutes links in "all" mode and exempts trusted users', function () {
    const { router, services } = createRouter();
    services.moderationState.setMuteLinks({ mode: 'all', duration: 60, by: 'Mod' });

    router.handleMuteLinks({ user: 'trustedUser', roles: ['TRUSTED'], message: 'https://a.com' });
    router.handleMuteLinks({ user: 'test1', roles: [], message: 'https://twitch.tv' });

    assert.strictEqual(services.punishmentStream.write.callCount, 1);
    assert.deepStrictEqual(
      services.punishmentStream.write.getCall(0).args[0],
      makeMute('test1', 60, 'test1 muted for 1m for posting a link while link muting is on.'),
    );
  });

  it('only mutes link messages that mention the configured user in "on" mode', function () {
    const { router, services } = createRouter();
    services.moderationState.applySnapshot({
      mutelinks: { mode: 'on', duration: 1200, mention: 'Destiny' },
    });

    router.handleMuteLinks({ user: 'test1', message: 'hello https://twitch.tv' });
    router.handleMuteLinks({ user: 'test2', message: 'destiny click https://twitch.tv' });
    router.handleMuteLinks({ user: 'test3', message: 'destiny says hello' });

    assert.strictEqual(services.punishmentStream.write.callCount, 1);
    assert.deepStrictEqual(
      services.punishmentStream.write.getCall(0).args[0],
      makeMute('test2', 1200, 'test2 muted for 20m for tagging Destiny with a link.'),
    );
  });

  it('mutes repeated links in "repeat" mode', function () {
    const { router, services } = createRouter();
    services.chatCache.getRecentUrls = sinon.stub().returns(['twitch.tv/']);
    services.moderationState.setMuteLinks({ mode: 'repeat', duration: 900, by: 'Mod' });

    router.handleMuteLinks({ user: 'test1', message: 'new link https://reddit.com' });
    router.handleMuteLinks({ user: 'test2', message: 'old link https://twitch.tv' });

    assert.strictEqual(services.punishmentStream.write.callCount, 1);
    assert.deepStrictEqual(
      services.punishmentStream.write.getCall(0).args[0],
      makeMute('test2', 900, 'test2 muted for 15m for posting a repeated link.'),
    );
  });

  it('mutes links older than the breaking news max age', async function () {
    const htmlMetadata = {
      getOpenGraphDate: sinon.stub().resolves(new Date(1770000000000 - 600 * 1000)),
    };
    const { router, services } = createRouter({ htmlMetadata });
    services.moderationState.setBreakingNews({ mode: 'all', maxAge: 300, by: 'Mod' });

    router.handleBreakingNews({ user: 'test1', message: 'old news https://example.com/story' });
    await Promise.resolve();

    assert.strictEqual(services.punishmentStream.write.callCount, 1);
    assert.deepStrictEqual(
      services.punishmentStream.write.getCall(0).args[0],
      makeMute(
        'test1',
        300,
        'test1 muted for 5m for posting a link older than 5m while breaking news mode is on.',
      ),
    );
  });

  it('ignores fresh links and unmentioned links in breaking news mode', async function () {
    const getOpenGraphDate = sinon.stub().resolves(new Date(1770000000000));
    const { router, services } = createRouter({ htmlMetadata: { getOpenGraphDate } });
    services.moderationState.setBreakingNews({ mode: 'on', maxAge: 300, by: 'Destiny' });

    router.handleBreakingNews({ user: 'test1', message: 'old news https://example.com/story' });
    router.handleBreakingNews({
      user: 'test2',
      message: 'destiny old news https://example.com/fresh',
    });
    await Promise.resolve();

    assert.strictEqual(services.punishmentStream.write.callCount, 0);
    assert.strictEqual(getOpenGraphDate.callCount, 1);
  });
});
