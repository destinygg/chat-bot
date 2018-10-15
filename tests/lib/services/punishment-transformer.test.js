const assert = require('assert');
const sinon = require('sinon');
is
const PunishmentTransformer = require('../../../lib/services/punishment-transformer');

describe('Punishment tests ', () => {

  it('bloops', () => {
    const punishmentStream = new PunishmentTransformer({});
    punishmentStream.write({user: 'bob', duration: 10000})
  });
});

