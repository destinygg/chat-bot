const assert = require('assert');
const sinon = require('sinon');
const config = require('../../../../lib/configuration/prod.config.json');
const MessageRelay = require('../../../../lib/services/message-relay');
const PunishmentCache = require('../../../../lib/services/punishment-cache');
const RoleCache = require('../../../../lib/services/role-cache');
const messageMatching = require('../../../../lib/services/message-matching');
const { ban } = require('../../../../lib/commands/implementations/ban');

describe('Ban command', () => {
  beforeEach(() => {
    const roleCache = new RoleCache(config.roleCache);
    roleCache.roleMap = {
      kierke: { roles: ['flair28'], timestamp: 123 },
      poorkierke: { roles: [], timestamp: 123 },
    };

    this.mockServices = {
      messageRelay: new MessageRelay(),
      messageMatching,
      punishmentStream: {
        write: sinon.spy(),
      },
      punishmentCache: new PunishmentCache(config.punishmentCache),
      roleCache,
    };
  });

  it('always bans regardless of flair', () => {
    const output1 = ban.work('kierke 10m No reason', this.mockServices, { user: 'kierke' }).output;
    const output2 = ban.work('poorkierke 10m No reason', this.mockServices, {
      user: 'poorkierke',
    }).output;
    assert.strictEqual(output1, null);
    assert.strictEqual(output2, null);
    assert.strictEqual(this.mockServices.punishmentStream.write.callCount, 2);
  });
});
