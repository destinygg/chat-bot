const EventEmitter = require('events');

class BannedPhrases extends EventEmitter {
  constructor() {
    super();
  }

  addBannedPhrase(phrase) {
	  this.emit('data', { action: 'add', phrase });
  }

  removeBannedPhrase(phrase) {
	  this.emit('data', { action: 'remove', phrase });
  }
}

module.exports = BannedPhrases;
