const { makeMute } = require('../../../lib/chat-utils/punishment-helpers');
const GulagRunner = require('./../../../lib/services/gulag-runner');
const assert = require('assert');

describe('Gulag Runner Tests', () => {
  const getMockServices = () => { return {
    messageRelay: {
      messages: [],
      sendOutputMessage: (message) => {
        this.mockServices.messageRelay.messages.push(message)
      }
    },
    punishmentStream: {
      punishments: [],
      push: (punishment) => this.mockServices.punishmentStream.punishments.push(punishment)
    }
  }};

  beforeEach(() => {
    this.mockServices = getMockServices();
    this.runner = new GulagRunner(this.mockServices, {
      enabled: true,
      matchCountdownMilliseconds: 1,
      matchDurationMilliseconds: 1,
      muteDurationSeconds: 1,
      maxStonesPerMatch: 2,
      stoneHitChance: 100
    });
  });

  it('can add prisoners to the queue', (done) => {
    this.runner.enabled = false;
    this.runner.addPrisoner('example');
    assert.deepStrictEqual(this.runner.prisoners, ['example']);
    done()
  });

  it('can remove prisoners from the queue', (done) => {
    this.runner.enabled = false;
    this.runner.addPrisoner('example');
    this.runner.removePrisoner('example');
    assert.deepStrictEqual(this.runner.prisoners, []);
    done()
  });

  it('can remove all prisoners from the queue', (done) => {
    this.runner.enabled = false;
    this.runner.addPrisoner('example');
    this.runner.addPrisoner('example2');
    assert.deepStrictEqual(this.runner.prisoners, ['example', 'example2']);
    const freed = this.runner.emptyGulag();
    assert.deepStrictEqual(freed, ['example', 'example2']);
    assert.deepStrictEqual(this.runner.prisoners, []);
    done()
  });

  it('can handle stones being thrown', (done) => {
    this.runner.currentMatch = {
      stonesThrown: {},
      player1: ['55', 123],
      contestants: ['player1', 'player2']
    };
    this.runner.throwStone('dummyuser', 'player1');
    assert.deepStrictEqual(this.runner.currentMatch, {
      stonesThrown: {
        'dummyuser': 1
      },
      player1: [null, null],
      contestants: ['player1', 'player2']
    });
    this.runner.currentMatch.player1 = ['55', 124];
    this.runner.throwStone('dummyuser', 'player1');
    assert.deepStrictEqual(this.runner.currentMatch, {
      stonesThrown: {
        'dummyuser': 2
      },
      player1: [null, null],
      contestants: ['player1', 'player2']
    });
    this.runner.currentMatch.player1 = ['55', 125];
    this.runner.throwStone('dummyuser', 'player1');
    assert.deepStrictEqual(this.runner.currentMatch, {
      stonesThrown: {
        'dummyuser': 2
      },
      player1: ['55', 125],
      contestants: ['player1', 'player2']
    });
    done()
  });

  it('can handle answers being recorded', (done) => {
    this.runner.currentMatch = {
      contestants: ['user1', 'user2'],
      user1: [null, null],
      user2: [null, null]
    };
    const isUser1Recorded = this.runner.recordAnswer('user1', '123');
    assert.deepStrictEqual(isUser1Recorded, true);
    assert.deepStrictEqual(this.runner.currentMatch.user1[0], '123');
    const isUser2Recorded = this.runner.recordAnswer('user2', '123');
    assert.deepStrictEqual(this.runner.currentMatch.user1[0], '123');
    assert.deepStrictEqual(isUser2Recorded, true);
    const isUser3Recorded = this.runner.recordAnswer('user3', '123');
    assert.deepStrictEqual(isUser3Recorded, false);
    done()
  });

  it('can handle running a gulag match with nobody answering', (done) => {
    this.runner.countdownHandle = 'dummyhandle';
    this.runner.addPrisoner('prisoner1');
    this.runner.addPrisoner('prisoner2');
    this.runner.startMatchCountdown();
    setTimeout(() => {
      assert.deepStrictEqual(this.mockServices.punishmentStream.punishments, [
        makeMute('prisoner2', this.runner.muteDurationSeconds, 'Lost in the gulag'),
        makeMute('prisoner1', this.runner.muteDurationSeconds, 'Lost in the gulag')
      ]);
      assert.deepStrictEqual(this.mockServices.messageRelay.messages.slice(0, 1), [
        'prisoner2 and prisoner1 are now engaged in mortal combat in the gulag!'
      ]);
      assert.deepStrictEqual(this.mockServices.messageRelay.messages.slice(2), [
        `They have ${this.runner.matchDurationMilliseconds / 1000} seconds to answer with !answer.`,
        'The audience can use !stone <user> to cancel out a submitted answer',
        'Neither prisoner2 nor prisoner1 were able to answer in time'
      ]);
      done()
    }, 1000)
  });

  it('can handle running a gulag match with a winner', (done) => {
    this.runner.countdownHandle = 'dummyhandle';
    this.runner.addPrisoner('prisoner1');
    this.runner.addPrisoner('prisoner2');
    this.runner.matchDurationMilliseconds = 700;
    this.runner.matchCountdownMilliseconds = 0;
    this.runner.startMatchCountdown();
    setTimeout(() => {
      this.runner.currentMatch['prisoner1'] = [this.runner.currentMatch.answer, 123];
      setTimeout(() => {
        assert.deepStrictEqual(this.mockServices.punishmentStream.punishments, [
          makeMute('prisoner2', this.runner.muteDurationSeconds, 'Lost in the gulag')
        ]);
        assert.deepStrictEqual(this.mockServices.messageRelay.messages.slice(0, 1), [
          'prisoner2 and prisoner1 are now engaged in mortal combat in the gulag!'
        ]);
        assert.deepStrictEqual(this.mockServices.messageRelay.messages.slice(2), [
          `They have ${this.runner.matchDurationMilliseconds / 1000} seconds to answer with !answer.`,
          'The audience can use !stone <user> to cancel out a submitted answer',
          'prisoner1 beat prisoner2 and won their freedom, prisoner2 did not answer correctly in time'
        ]);
        done()
      }, 700);
    }, 100)
  });

  it('can handle running a gulag match with a winner where both players answer', (done) => {
    this.runner.countdownHandle = 'dummyhandle';
    this.runner.addPrisoner('prisoner1');
    this.runner.addPrisoner('prisoner2');
    this.runner.matchDurationMilliseconds = 700;
    this.runner.matchCountdownMilliseconds = 0;
    this.runner.startMatchCountdown();
    setTimeout(() => {
      this.runner.currentMatch['prisoner1'] = [this.runner.currentMatch.answer, 1];
      this.runner.currentMatch['prisoner2'] = [this.runner.currentMatch.answer, 2];
      setTimeout(() => {
        assert.deepStrictEqual(this.mockServices.punishmentStream.punishments, [
          makeMute('prisoner2', this.runner.muteDurationSeconds, 'Lost in the gulag')
        ]);
        assert.deepStrictEqual(this.mockServices.messageRelay.messages.slice(0, 1), [
          'prisoner2 and prisoner1 are now engaged in mortal combat in the gulag!'
        ]);
        assert.deepStrictEqual(this.mockServices.messageRelay.messages.slice(2), [
          `They have ${this.runner.matchDurationMilliseconds / 1000} seconds to answer with !answer.`,
          'The audience can use !stone <user> to cancel out a submitted answer',
          'prisoner1 beat prisoner2 by 0.001s and won their freedom'
        ]);
        done()
      }, 700);
    }, 100)
  });

});