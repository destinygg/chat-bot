const assert = require('assert');
const RoleCache = require('../../../lib/services/role-cache');
const moment = require('moment');
const _ = require('lodash');

describe('RoleCache tests ', () => {
  it('getRecentRandomUsername fetches a random user that has chatted in the last 30 minutes', function() {
    const roleCache = new RoleCache({});
    const now = moment().unix();
    const validUsers = ['jesus', 'johnpyp'];
    roleCache.roleMap = {
      johnpyp: { roles: [], timestamp: now - 29 * 60 },
      linusred: { roles: [], timestamp: now - 31 * 60 },
      jesus: { roles: [], timestamp: now - 10 * 60 },
    };

    _.range(10).forEach(i => {
      assert(validUsers.includes(roleCache.getRecentRandomUsername()));
    });
  });
});
