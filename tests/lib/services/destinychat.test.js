const assert = require('assert');
const sinon = require('sinon');

const DestinyChat = require('../../../lib/services/destinychat');

function createChat() {
  const logger = {
    info: () => {},
    warn: () => {},
    error: sinon.spy(),
  };
  const chat = new DestinyChat(
    {
      url: 'ws://localhost:8420',
      origin: 'www.example.com',
      cookieToken: 'token',
      botNick: 'botbotbot',
    },
    { logger },
  );
  chat.ws = { send: sinon.spy() };
  return { chat, logger };
}

describe('DestinyChat moderation state transport', () => {
  it('sends moderation state events as NAME plus JSON', function () {
    const { chat } = createChat();

    chat.sendEvent('NUKE', { phrase: 'test', victims: [{ id: 1, nick: 'User' }] });

    assert.deepStrictEqual(chat.ws.send.getCall(0).args, [
      'NUKE {"phrase":"test","victims":[{"id":1,"nick":"User"}]}',
    ]);
  });

  it('parses STATES events', function () {
    const { chat } = createChat();
    const onStates = sinon.spy();
    chat.on('states', onStates);

    chat.parseMessages({
      data: 'STATES {"subonly":{"tier":1},"nukes":[],"nukedUsers":[]}',
    });

    assert.deepStrictEqual(onStates.getCall(0).args, [
      { subonly: { tier: 1 }, nukes: [], nukedUsers: [] },
    ]);
  });

  it('logs malformed STATES events without throwing', function () {
    const { chat, logger } = createChat();

    chat.parseMessages({ data: 'STATES not-json' });

    assert.strictEqual(logger.error.callCount, 1);
  });
});
