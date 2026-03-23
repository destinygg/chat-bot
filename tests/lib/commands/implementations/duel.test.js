const assert = require('assert');
const sinon = require('sinon');
const { makeMute } = require('../../../../lib/chat-utils/punishment-helpers');
const MessageRelay = require('../../../../lib/services/message-relay');

const duelModulePath = require.resolve('../../../../lib/commands/implementations/duel');

const REVERSE_HOMOGLYPHS = {
  '\u0430': 'a',
  '\u0441': 'c',
  '\u0435': 'e',
  '\u043E': 'o',
  '\u0440': 'p',
  '\u0455': 's',
  '\u0456': 'i',
};

function stripHomoglyphs(str) {
  return str.replace(/./gu, (ch) => REVERSE_HOMOGLYPHS[ch] || ch);
}

function freshDuel() {
  delete require.cache[duelModulePath];
  return require(duelModulePath).duel;
}

describe('duel command', () => {
  beforeEach(function () {
    this.duel = freshDuel();
    this.mockServices = {
      messageRelay: new MessageRelay(),
      punishmentStream: {
        write: sinon.spy(),
      },
    };
    this.rawMessage = { user: 'ModUser' };
  });

  afterEach(function () {
    this.mockServices.messageRelay.stopRelay('duel');
  });

  it('announces duel with correct format', function () {
    const clock = sinon.useFakeTimers();
    try {
      const sendSpy = sinon.spy(this.mockServices.messageRelay, 'sendOutputMessage');
      const output = this.duel.work('Alice Bob', this.mockServices, this.rawMessage);
      assert.strictEqual(output.err, null);
      assert.ok(output.output.includes('Alice'));
      assert.ok(output.output.includes('Bob'));
      assert.ok(output.output.includes('DUEL!'));
      assert.ok(output.output.includes('10m'));
      assert.ok(output.output.includes('10 seconds'));

      clock.tick(10000);

      assert.strictEqual(sendSpy.callCount, 1);
      const challengeMsg = sendSpy.getCall(0).args[0];
      assert.ok(challengeMsg.includes('DUEL!'));
      assert.ok(challengeMsg.includes('30 seconds'));
      assert.ok(/"[^"]+"/.test(challengeMsg));
    } finally {
      clock.restore();
    }
  });

  it('rejects concurrent duels', function () {
    this.duel.work('Alice Bob', this.mockServices, this.rawMessage);
    const output2 = this.duel.work('Charlie Dave', this.mockServices, this.rawMessage);
    assert.ok(output2.output.includes('already in progress'));
  });

  it('detects winner and mutes loser', function () {
    const clock = sinon.useFakeTimers();
    try {
      const sendSpy = sinon.spy(this.mockServices.messageRelay, 'sendOutputMessage');
      this.duel.work('Alice Bob', this.mockServices, this.rawMessage);
      clock.tick(10000);

      const phrase = stripHomoglyphs(/"([^"]+)"/.exec(sendSpy.getCall(0).args[0])[1]);

      this.mockServices.messageRelay.relayMessageToListeners('msg', {
        message: phrase,
        user: 'Alice',
      });

      assert.strictEqual(this.mockServices.punishmentStream.write.callCount, 1);
      assert.deepStrictEqual(
        this.mockServices.punishmentStream.write.getCall(0).args[0],
        makeMute('Bob', 600),
      );
    } finally {
      clock.restore();
    }
  });

  it('ignores messages from non-duelists', function () {
    const clock = sinon.useFakeTimers();
    try {
      const sendSpy = sinon.spy(this.mockServices.messageRelay, 'sendOutputMessage');
      this.duel.work('Alice Bob', this.mockServices, this.rawMessage);
      clock.tick(10000);

      const phrase = stripHomoglyphs(/"([^"]+)"/.exec(sendSpy.getCall(0).args[0])[1]);

      this.mockServices.messageRelay.relayMessageToListeners('msg', {
        message: phrase,
        user: 'Charlie',
      });

      assert.strictEqual(this.mockServices.punishmentStream.write.callCount, 0);
    } finally {
      clock.restore();
    }
  });

  it('matches phrase case-insensitively', function () {
    const clock = sinon.useFakeTimers();
    try {
      const sendSpy = sinon.spy(this.mockServices.messageRelay, 'sendOutputMessage');
      this.duel.work('Alice Bob', this.mockServices, this.rawMessage);
      clock.tick(10000);

      const phrase = stripHomoglyphs(/"([^"]+)"/.exec(sendSpy.getCall(0).args[0])[1]);

      this.mockServices.messageRelay.relayMessageToListeners('msg', {
        message: phrase.toUpperCase(),
        user: 'Bob',
      });

      assert.strictEqual(this.mockServices.punishmentStream.write.callCount, 1);
      assert.deepStrictEqual(
        this.mockServices.punishmentStream.write.getCall(0).args[0],
        makeMute('Alice', 600),
      );
    } finally {
      clock.restore();
    }
  });

  it('ignores incorrect messages from duelists', function () {
    const clock = sinon.useFakeTimers();
    try {
      this.duel.work('Alice Bob', this.mockServices, this.rawMessage);
      clock.tick(10000);

      this.mockServices.messageRelay.relayMessageToListeners('msg', {
        message: 'wrong phrase entirely',
        user: 'Alice',
      });

      assert.strictEqual(this.mockServices.punishmentStream.write.callCount, 0);
    } finally {
      clock.restore();
    }
  });

  it('uses custom duration when specified', function () {
    const clock = sinon.useFakeTimers();
    try {
      const sendSpy = sinon.spy(this.mockServices.messageRelay, 'sendOutputMessage');
      const output = this.duel.work('5m Alice Bob', this.mockServices, this.rawMessage);
      assert.ok(output.output.includes('5m'));

      clock.tick(10000);

      const phrase = stripHomoglyphs(/"([^"]+)"/.exec(sendSpy.getCall(0).args[0])[1]);

      this.mockServices.messageRelay.relayMessageToListeners('msg', {
        message: phrase,
        user: 'Alice',
      });

      assert.deepStrictEqual(
        this.mockServices.punishmentStream.write.getCall(0).args[0],
        makeMute('Bob', 300),
      );
    } finally {
      clock.restore();
    }
  });

  it('uses default duration when none specified', function () {
    const output = this.duel.work('Alice Bob', this.mockServices, this.rawMessage);
    assert.ok(output.output.includes('10m'));
  });

  it('times out after 30 seconds with no mute', function () {
    const clock = sinon.useFakeTimers();
    try {
      const sendSpy = sinon.spy(this.mockServices.messageRelay, 'sendOutputMessage');
      this.duel.work('Alice Bob', this.mockServices, this.rawMessage);

      // 10s prep + 30s typing window
      clock.tick(10000 + 30000);

      assert.strictEqual(this.mockServices.punishmentStream.write.callCount, 0);
      assert.strictEqual(sendSpy.callCount, 2); // challenge msg + timeout msg
      assert.ok(sendSpy.getCall(1).args[0].includes('timed out'));
    } finally {
      clock.restore();
    }
  });

  it('rejects self-duel', function () {
    const output = this.duel.work('Alice Alice', this.mockServices, this.rawMessage);
    assert.ok(output.output.includes("can't duel someone against themselves"));
  });

  it('rejects self-duel case-insensitively', function () {
    const output = this.duel.work('alice ALICE', this.mockServices, this.rawMessage);
    assert.ok(output.output.includes("can't duel someone against themselves"));
  });

  it('allows new duel after previous one completes', function () {
    const clock = sinon.useFakeTimers();
    try {
      const sendSpy = sinon.spy(this.mockServices.messageRelay, 'sendOutputMessage');
      this.duel.work('Alice Bob', this.mockServices, this.rawMessage);
      clock.tick(10000);

      const phrase1 = stripHomoglyphs(/"([^"]+)"/.exec(sendSpy.getCall(0).args[0])[1]);

      this.mockServices.messageRelay.relayMessageToListeners('msg', {
        message: phrase1,
        user: 'Alice',
      });

      const output2 = this.duel.work('Charlie Dave', this.mockServices, this.rawMessage);
      assert.ok(output2.output.includes('DUEL!'));
      assert.ok(output2.output.includes('Charlie'));
      assert.ok(output2.output.includes('Dave'));
    } finally {
      clock.restore();
    }
  });

  it('allows new duel after timeout', function () {
    const clock = sinon.useFakeTimers();
    try {
      this.duel.work('Alice Bob', this.mockServices, this.rawMessage);
      clock.tick(10000 + 30000);

      const output2 = this.duel.work('Charlie Dave', this.mockServices, this.rawMessage);
      assert.ok(output2.output.includes('DUEL!'));
    } finally {
      clock.restore();
    }
  });

  it('displayed phrase contains at least one non-ASCII character', function () {
    const clock = sinon.useFakeTimers();
    try {
      const sendSpy = sinon.spy(this.mockServices.messageRelay, 'sendOutputMessage');
      this.duel.work('Alice Bob', this.mockServices, this.rawMessage);
      clock.tick(10000);

      const displayPhrase = /"([^"]+)"/.exec(sendSpy.getCall(0).args[0])[1];
      assert.ok(/[^\x00-\x7F]/.test(displayPhrase), 'display phrase should contain a non-ASCII homoglyph');
    } finally {
      clock.restore();
    }
  });

  it('rejects copy-pasted phrase containing homoglyph', function () {
    const clock = sinon.useFakeTimers();
    try {
      const sendSpy = sinon.spy(this.mockServices.messageRelay, 'sendOutputMessage');
      this.duel.work('Alice Bob', this.mockServices, this.rawMessage);
      clock.tick(10000);

      const displayPhrase = /"([^"]+)"/.exec(sendSpy.getCall(0).args[0])[1];

      this.mockServices.messageRelay.relayMessageToListeners('msg', {
        message: displayPhrase,
        user: 'Alice',
      });

      assert.strictEqual(this.mockServices.punishmentStream.write.callCount, 0);
    } finally {
      clock.restore();
    }
  });
});
