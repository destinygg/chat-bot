const EventEmitter = require('events');
const moment = require('moment');
const { makeMute } = require('../chat-utils/punishment-helpers');

const questionAnswerGenerators = [
  () => {
    const [n1, n2] = [Math.floor(Math.random() * 100), Math.floor(Math.random() * 100)];
    const op = Math.floor(Math.random() * 3);
    let answer = null;
    let symbol = null;
    if (op === 0) {
      answer = n1 + n2;
      symbol = '+';
    } else if (op === 1) {
      answer = n1 - n2;
      symbol = '-';
    } else if (op === 2) {
      answer = n1 * n2;
      symbol = '*';
    }
    return { question: `What is ${n1} ${symbol} ${n2}?`, answer };
  },
];

function handleGulagEndOfMatch(runner) {
  const [contestantOne, contestantTwo] = runner.currentMatch.contestants;
  const [c1Answer, c1Ts] = runner.currentMatch[contestantOne];
  const [c2Answer, c2Ts] = runner.currentMatch[contestantTwo];
  let winner = null;
  let loser = null;
  let message = null;
  if (c1Answer !== null && c2Answer !== null) {
    if (c1Answer === runner.currentMatch.answer && c2Answer === runner.currentMatch.answer) {
      [winner, loser] =
        c1Ts < c2Ts ? [contestantOne, contestantTwo] : [contestantTwo, contestantOne];
      message = `${winner} beat ${loser} by ${Math.abs(c1Ts - c2Ts) / 1000}s and won their freedom`;
    } else if (c1Answer === runner.currentMatch.answer) {
      [winner, loser] = [contestantOne, contestantTwo];
    } else if (c2Answer === runner.currentMatch.answer) {
      [winner, loser] = [contestantTwo, contestantOne];
    } else {
      [winner, loser] = [null, null];
    }
  }
  if (message === null && winner !== null) {
    message = `${winner} beat ${loser} and won their freedom, ${loser} did not answer correctly in time`;
  }
  if (winner !== null) {
    runner.services.messageRelay.sendOutputMessage(message);
    runner.services.punishmentStream.push(
      makeMute(loser, this.muteDurationSeconds, 'Lost their gulag match'),
    );
  } else {
    runner.services.messageRelay.sendOutputMessage(
      `Neither ${contestantOne} nor ${contestantTwo} were able to answer in time`,
    );
    runner.services.punishmentStream.push(
      makeMute(contestantOne, this.muteDurationSeconds, 'Lost in the gulag'),
    );
    runner.services.punishmentStream.push(
      makeMute(contestantTwo, this.muteDurationSeconds, 'Lost in the gulag'),
    );
  }
  runner.updateCurrentMatch(null);
}

function handleGulagStartOfMatch(runner) {
  if (runner.prisoners.length !== 0) {
    if (runner.prisoners.length === 1) {
      const releasedUser = runner.pollPrisoner();
      runner.services.messageRelay.sendOutputMessage(
        `${releasedUser} had no opponent and was released`,
      );
    } else {
      const questionAnswerContainer = questionAnswerGenerators[
        Math.floor(Math.random() * questionAnswerGenerators.length)
      ]();
      const [contestantOne, contestantTwo] = [runner.pollPrisoner(), runner.pollPrisoner()];
      const matchProps = {
        contestants: [contestantOne, contestantTwo],
        answer: questionAnswerContainer.answer.toString(),
        stonesThrown: {},
      };
      matchProps[contestantOne] = [null, null];
      matchProps[contestantTwo] = [null, null];
      runner.updateCurrentMatch(matchProps);
      runner.services.messageRelay.sendOutputMessage(
        `${contestantOne} and ${contestantTwo} are now engaged in mortal combat in the gulag!`,
      );
      runner.services.messageRelay.sendOutputMessage(questionAnswerContainer.question);
      runner.services.messageRelay.sendOutputMessage(
        `They have ${runner.matchDurationMilliseconds / 1000} seconds to answer with !answer.`,
      );
      runner.services.messageRelay.sendOutputMessage(
        'The audience can use !stone <user> to cancel out a submitted answer',
      );
      setTimeout(() => {
        handleGulagEndOfMatch(runner);
      }, runner.matchDurationMilliseconds);
    }
  }
}

class GulagRunner extends EventEmitter {
  constructor(services, config) {
    super();
    this.services = services;
    this.prisoners = [];
    this.enabled = config.enabled || false;
    this.matchIntervalMilliseconds = config.matchIntervalMilliseconds || 60000;
    this.matchDurationMilliseconds = config.matchDurationMilliseconds || 45000;
    this.muteDurationSeconds = config.muteDurationSeconds || 900;
    this.maxStonesPerMatch = config.maxStonesPerMatch || 1;
    this.currentMatch = null;
    this.intervalHandle = null;
  }

  startMatchScheduler() {
    if (!this.enabled) return;
    this.intervalHandle = setInterval(() => {
      handleGulagStartOfMatch(this);
    }, this.matchIntervalMilliseconds);
  }

  stopMatchScheduler() {
    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  addPrisoner(prisoner) {
    this.prisoners.push(prisoner);
  }

  removePrisoner(prisoner) {
    const idx = this.prisoners.indexOf(prisoner);
    if (idx !== -1) {
      this.prisoners.splice(idx, 1);
      return true;
    }
    return false;
  }

  pollPrisoner() {
    return this.prisoners.pop();
  }

  emptyGulag() {
    const freedPrisoners = this.prisoners;
    this.prisoners = [];
    return freedPrisoners;
  }

  updateCurrentMatch(newState) {
    if (newState === null) this.currentMatch = null;
    else if (this.currentMatch === null) this.currentMatch = newState;
    else Object.assign(this.currentMatch, newState);
  }

  isMatchActive() {
    return this.currentMatch !== null;
  }

  isMatchParticipant(user) {
    return this.isMatchActive() && this.currentMatch.contestants.indexOf(user) !== -1;
  }

  recordAnswer(user, answer) {
    if (this.isMatchActive() && this.isMatchParticipant(user)) {
      this.currentMatch[user] = [answer, moment().unix()];
      return true;
    }
    return false;
  }

  throwStone(thrower, target) {
    if (!this.isMatchActive()) {
      return -1;
    }
    if (this.isMatchParticipant(target)) {
      if (
        !(thrower in this.currentMatch.stonesThrown) ||
        this.currentMatch.stonesThrown[thrower] < this.gulagMaxStonesPerMatch
      ) {
        const roll = Math.floor(Math.random() * 10);
        let returnCode = 0;
        if (roll >= 7) {
          this.currentMatch[target] = [null, null];
          returnCode = 1;
        }
        if (thrower in this.currentMatch.stonesThrown) {
          this.currentMatch.stonesThrown[thrower] = 1;
        } else {
          this.currentMatch.stonesThrown[thrower] += 1;
        }
        return returnCode;
      }
    }
    return -1;
  }
}

module.exports = GulagRunner;
