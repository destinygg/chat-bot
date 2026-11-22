const assert = require('assert');
const { parseMessage } = require('../../../lib/chat-utils/parse-commands-from-chat');

describe('parseMessage', () => {
  it('takes roles from the roles field, not from features', function () {
    const parsed = parseMessage(
      `MSG ${JSON.stringify({
        nick: 'someone',
        id: 123,
        features: ['moderator', 'protected'],
        roles: ['MODERATOR'],
        data: 'hello',
      })}`,
    );

    assert.deepStrictEqual(parsed, {
      user: 'someone',
      id: 123,
      roles: ['MODERATOR'],
      message: 'hello',
    });
  });
});
