const assert = require('assert');
const sinon = require('sinon');
const EventEmitter = require('events');

const ChatServiceRouter = require('../../../lib/message-routing/chat-service-router');
const ModerationState = require('../../../lib/services/moderation-state');

function createRouter() {
  const bot = new EventEmitter();
  bot.connect = sinon.spy();
  bot.sendMessage = sinon.spy();
  bot.sendWhisper = sinon.spy();
  bot.sendMultiLine = sinon.spy();
  bot.sendUnmute = sinon.spy();
  bot.sendMute = sinon.spy();
  bot.sendBan = sinon.spy();
  bot.sendUnban = sinon.spy();
  bot.sendEvent = sinon.spy();

  const logger = {
    info: sinon.spy(),
    warn: sinon.spy(),
    error: sinon.spy(),
  };
  const messageRelay = new EventEmitter();
  messageRelay.relayMessageToListeners = (type, message) => messageRelay.emit(type, message);
  const moderationState = new ModerationState();
  const router = new ChatServiceRouter(
    'dgg',
    bot,
    { routeIncomingMessages: sinon.spy() },
    { routeIncomingCommandMessage: sinon.stub().resolves({}) },
    logger,
    new EventEmitter(),
    new EventEmitter(),
    new EventEmitter(),
    messageRelay,
    moderationState,
  );
  router.create();
  return { router, bot, logger, messageRelay, moderationState };
}

describe('ChatServiceRouter moderation state', () => {
  beforeEach(function () {
    this.clock = sinon.useFakeTimers({ now: 1770000000000 });
  });

  afterEach(function () {
    this.clock.restore();
  });

  it('applies STATES snapshots to the moderation state', function () {
    const { bot, moderationState } = createRouter();

    bot.emit('states', {
      subonly: { tier: 2 },
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
      mutelinks: { mode: 'all', duration: 60, changedBy: 'Mod' },
      breakingnews: { mode: 'off' },
      nukedUsers: [
        { id: 1, nick: 'User', nukeKey: 'plain:test', mega: false, expiresAt: 1770000600000 },
      ],
      timestamp: 1770000000000,
    });

    assert.strictEqual(moderationState.getSubModeTier(), 2);
    assert.deepStrictEqual(
      moderationState.getNukes().map((nuke) => nuke.phrase),
      ['test'],
    );
    assert.deepStrictEqual(
      moderationState.getNukedUsers().map((victim) => victim.nick),
      ['User'],
    );
    assert.strictEqual(moderationState.mutelinks.mode, 'all');
  });

  it('logs and relays ERR responses', function () {
    const { bot, logger, messageRelay } = createRouter();
    const onErr = sinon.spy();
    messageRelay.on('err', onErr);

    bot.emit('err', 'nopermission');

    assert.strictEqual(onErr.getCall(0).args[0], 'nopermission');
    assert.strictEqual(logger.warn.callCount, 1);
  });
});
