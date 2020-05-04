import { makeMute } from '../chat-utils/punishment-helpers';

const EventEmitter = require('events');
const _ = require('lodash');
const { makeUnmute } = require('../chat-utils/punishment-helpers');

class GulagRunner extends EventEmitter {
  constructor(services, config) {
    super();
    this.services = services;
    this.gulagUsers = [];
    this.gulagMatchInterval = config.matchIntervalMilliseconds || 900000;
    this.gulagMatchDuration = config.matchDurationSeconds || 10;
    this.gulagMuteDuration = config.muteDurationSeconds || 3600;
    this.currentMatch = null;
  }

  startMatchScheduler() {
    setInterval(() => {
      if (this.gulagUsers.length !== 0) {
        if (this.gulagUsers.length === 1) {
          const releasedUser = this.gulagUsers.pop();
          this.services.messageRelay.sendOutputMessage(
            `${releasedUser} had no opponent and was released`,
          );
          this.services.punishmentStream.push(makeUnmute(releasedUser));
        } else {
          const [contestantOne, contestantTwo] = [this.gulagUsers.pop(), this.gulagUsers.pop()];
          const [n1, n2] = [Math.floor(Math.random() * 100), Math.floor(Math.random() * 100)];
          this.currentMatch = {
            contestantOne,
            contestantTwo,
            answer: (n1 * n2).toString(),
            winner: null,
          };
          this.services.punishmentStream.push(makeUnmute(contestantOne));
          this.services.punishmentStream.push(makeUnmute(contestantTwo));
          this.services.messageRelay.sendOutputMessage(
            `${contestantOne} and ${contestantTwo} are now engaged in mortal combat in the gulag.  What is ${n1} * ${n2}? You have ${this.gulagMatchDuration} seconds to answer with !ga <number>`,
          );
          setTimeout(() => {
            if (this.currentMatch.winner !== null) {
              const loser =
                contestantOne === this.currentMatch.winner ? contestantTwo : contestantOne;
              this.services.messageRelay.sendOutputMessage(
                `${this.currentMatch.winner} has won their gulag match and will remain free`,
              );
              this.services.punishmentStream.push(
                makeMute(loser, this.gulagMuteDuration, 'Lost their gulag match'),
              );
            } else {
              this.services.messageRelay.sendOutputMessage(
                `Neither ${contestantOne} nor ${contestantTwo} were able to answer in time`,
              );
              this.services.punishmentStream.push(
                makeMute(contestantOne, this.gulagMuteDuration, 'Lost in the gulag'),
              );
              this.services.punishmentStream.push(
                makeMute(contestantTwo, this.gulagMuteDuration, 'Lost in the gulag'),
              );
            }
            this.currentMatch = null;
          }, this.gulagMatchDuration);
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

  isMatchParticipant(user) {
    return (
      this.currentMatch !== null &&
      (this.currentMatch.contestantOne === user || this.currentMatch.contestantTwo === user)
    );
  }

  recordAnswer(user, answer) {
    if (this.currentMatch.winner === null && this.currentMatch.answer === answer) {
      this.currentMatch.winner = user;
      return true;
    }
    return false;
  }
}

module.exports = GulagRunner;
