/* eslint-disable no-underscore-dangle */
const { Transform } = require('stream');

class PunishmentTransformer extends Transform {
  constructor(services) {
    super({
      readableObjectMode: true,
      writableObjectMode: true,
    });
    this.punishmentCache = services.punishmentCache;
    this.punishmentFormatter = services.punishmentFormatter;
  }

  _transform(object, encoding, callback) {
    this.punishmentFormatter = '';
    this.push(object);
    callback();
  }
}

module.exports = PunishmentTransformer;
