const assert = require('assert');
const sinon = require('sinon');

const PunishmentTransformer = require('../../../lib/services/punishment-read-write-stream');

describe('Punishment tests ', () => {

  it('bloops', () => {
    const punishmentStream = new PunishmentTransformer({});
    punishmentStream.write({user: 'bob', duration: 10000})
  });
});

