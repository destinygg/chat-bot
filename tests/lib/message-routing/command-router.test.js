const assert = require('assert');
const CommandRouter = require('../../../lib/message-routing/command-router');

describe('CommandRouter.checkPermission', () => {
  it('lets dgg moderator and admin roles run privileged commands', function () {
    assert.strictEqual(CommandRouter.checkPermission(true, ['MODERATOR']), false);
    assert.strictEqual(CommandRouter.checkPermission(true, ['ADMIN']), false);
  });

  it('lets Twitch moderators and the broadcaster run privileged commands', function () {
    assert.strictEqual(CommandRouter.checkPermission(true, ['moderator']), false);
    assert.strictEqual(CommandRouter.checkPermission(true, ['admin']), false);
  });

  it('blocks everyone else from privileged commands', function () {
    assert.strictEqual(CommandRouter.checkPermission(true, ['VIP', 'PROTECTED']), true);
    assert.strictEqual(CommandRouter.checkPermission(true, []), true);
  });
});
