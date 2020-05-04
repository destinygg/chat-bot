const EventEmitter = require('events');
const _ = require('lodash');
const { makeUnmute } = require('../chat-utils/punishment-helpers');

class GulagRunner extends EventEmitter {
  constructor(services, config) {
    super();
    this.services = services;
    this.gulagUsers = [];
    this.gulagMatchInterval = config.matchIntervalMilliseconds || 900000;
    this.gulagMuteDuration = config.muteDurationSeconds || 3600;
  }

  startMatchScheduler() {
    setInterval(() => {
      if (this.gulagUsers.length !== 0) {
        while (this.gulagUsers.length > 0) {
          if (this.gulagUsers.length === 1) {
            const releasedUser = this.gulagUsers.pop();
            this.services.messageRelay.sendOutputMessage(
              `${releasedUser} had no opponent and was released`,
            );
            this.services.punishmentStream.push(makeUnmute(releasedUser));
          } else {
            const [contestantOne, contestantTwo] = [this.gulagUsers.pop(), this.gulagUsers.pop()];
            const roll = Math.floor(Math.random() * 10);
            const [winner, loser] =
              roll <= 5 ? [contestantOne, contestantTwo] : [contestantTwo, contestantOne];
            this.services.messageRelay.sendOutputMessage(
              `${winner} won their match against ${loser} in the gulag and was released`,
            );
            this.services.punishmentStream.push(makeUnmute(winner));
          }
        }
      }
    }, this.gulagMatchInterval);
  }

  addUserToGulag(prisoner) {
    this.gulagUsers.push(prisoner);
  }

  emptyGulag() {
    this.gulagUsers.forEach(user => {
      this.services.punishmentStream.push(makeUnmute(user));
      this.services.messageRelay.sendOutputMessage(`${user} has been freed from the gulag`);
    });
  }
}

module.exports = GulagRunner;
