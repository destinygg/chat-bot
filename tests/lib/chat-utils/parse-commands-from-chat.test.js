const assert = require('assert');
const { parseMessage } = require('../../../lib/chat-utils/parse-commands-from-chat');

describe('parseMessage', () => {
  it('takes roles from the roles field, not from features', function () {
    const parsed = parseMessage(
      `MSG ${JSON.stringify({
        nick: 'someone',
        features: ['moderator', 'protected'],
        roles: ['MODERATOR'],
        data: 'hello',
      })}`,
    );

    assert.deepStrictEqual(parsed, { user: 'someone', roles: ['MODERATOR'], message: 'hello' });
  });
});
