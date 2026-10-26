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
    services.moderationState.addNuke({ phrase: 'test phrase', duration: 600 });

    router.routeIncomingMessages({
      user: 'Chatter',
      id: 123,
      roles: [],
      message: 'a TEST PHRASE appears',
    });

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
});
