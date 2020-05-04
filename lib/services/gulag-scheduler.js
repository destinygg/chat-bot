const EventEmitter = require('events');
const moment = require('moment');
const { makeMute } = require('../chat-utils/punishment-helpers');

class GulagRunner extends EventEmitter {
  constructor(services, config) {
    super();
    this.services = services;
    this.prisoners = [];
    this.enabled = config.enabled || false;
    this.gulagMatchInterval = config.matchIntervalMilliseconds || 900000;
    this.gulagMatchDuration = config.matchDurationSeconds || 10;
    this.gulagMuteDuration = config.muteDurationSeconds || 3600;
    this.gulagMaxStonesPerMatch = config.maxStonesPerMatch || 1;
    this.currentMatch = null;
    this.intervalHandle = null;
  }

  startMatchScheduler() {
    if (!this.enabled) return;
    this.intervalHandle = setInterval(() => {
      if (this.prisoners.length !== 0) {
        if (this.prisoners.length === 1) {
          const releasedUser = this.prisoners.pop();
          this.services.messageRelay.sendOutputMessage(
            `${releasedUser} had no opponent and was released`,
          );
        } else {
          const [contestantOne, contestantTwo] = [this.prisoners.pop(), this.prisoners.pop()];
          const [n1, n2] = [Math.floor(Math.random() * 100), Math.floor(Math.random() * 100)];
          this.currentMatch = {
            contestants: [contestantOne, contestantTwo],
            answer: (n1 * n2).toString(),
            winner: null,
            stonesThrown: {},
          };
          this.currentMatch[contestantOne] = [null, null];
          this.currentMatch[contestantTwo] = [null, null];
          this.services.messageRelay.sendOutputMessage(
            `${contestantOne} and ${contestantTwo} are now engaged in mortal combat in the gulag.  What is ${n1} * ${n2}? You have ${this.gulagMatchDuration} seconds to answer with !answer`,
          );
          setTimeout(() => {
            const [c1Answer, c1Ts] = this.currentMatch[contestantOne];
            const [c2Answer, c2Ts] = this.currentMatch[contestantTwo];
            let winner;
            let loser;
            let message = null;
            if (c1Answer !== null && c2Answer !== null) {
              if (c1Answer === this.currentMatch.answer && c2Answer === this.currentMatch.answer) {
                [winner, loser] =
                  c1Ts < c2Ts ? [contestantOne, contestantTwo] : [contestantTwo, contestantOne];
                message = `${winner} beat ${loser} by ${Math.abs(c1Ts - c2Ts) /
                  1000}s and won their freedom`;
              } else if (c1Answer === this.currentMatch.answer) {
                [winner, loser] = [contestantOne, contestantTwo];
              } else if (c2Answer === this.currentMatch.answer) {
                [winner, loser] = [contestantTwo, contestantOne];
              } else {
                [winner, loser] = [null, null];
              }
            }
            if (message === null && winner !== null) {
              message = `${winner} beat ${loser} and won their freedom, ${loser} did not answer correctly in time`;
            }
            if (winner !== null) {
              this.services.messageRelay.sendOutputMessage(message);
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

  stopMatchScheduler() {
    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  addUserToGulag(prisoner) {
    this.prisoners.push(prisoner);
  }

  removeUserFromGulag(prisoner) {
    const idx = this.prisoners.indexOf(prisoner);
    if (idx !== -1) {
      this.prisoners.splice(idx, 1);
      return true;
    }
    return false;
  }

  emptyGulag() {
    const freedPrisoners = this.prisoners;
    this.prisoners = [];
    return freedPrisoners;
  }

  isMatchActive() {
    return this.currentMatch !== null;
  }

  isMatchParticipant(user) {
    return this.currentMatch !== null && this.currentMatch.contestants.indexOf(user) !== -1;
  }

  recordAnswer(user, answer) {
    this.currentMatch[user] = [answer, moment().unix()];
  }

  throwStone(thrower, target) {
    if (this.isMatchParticipant(target)) {
      if (
        !(thrower in this.currentMatch.stonesThrown) ||
        this.currentMatch.stonesThrown[thrower] < this.gulagMaxStonesPerMatch
      ) {
        const roll = Math.floor(Math.random() * 10);
        if (roll >= 7) {
          this.currentMatch[target] = [null, null];
          return true;
        }
        if (thrower in this.currentMatch.stonesThrown) {
          this.currentMatch.stonesThrown[thrower] = 1;
        } else {
          this.currentMatch.stonesThrown[thrower] += 1;
        }
      }
    }
    return false;
  }
}

module.exports = GulagRunner;
