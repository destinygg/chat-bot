/* eslint-disable no-underscore-dangle */
const { Transform } = require('stream');

class PunishmentTransformer extends Transform {
  constructor(punishmentStore) {
    super({
      readableObjectMode: true,
      writableObjectMode: true,
    });
    this.punishmentStore = punishmentStore;
  }

  _transform(object, encoding, callback) {
    this.punishmentFormatter = '';
    this.push(object);
    callback();
  }
}

module.exports = PunishmentTransformer;
