const assert = require('assert');
const sinon = require('sinon');

const ModerationState = require('../../../lib/services/moderation-state');

function createState(config = {}) {
  const state = new ModerationState(config);
  const published = [];
  state.setPublisher((event, payload) => published.push({ event, payload }));
  return { state, published };
}

describe('Moderation state', () => {
  beforeEach(function () {
    this.clock = sinon.useFakeTimers({ now: 1770000000000 });
  });

  afterEach(function () {
    this.clock.restore();
  });

  it('starts with empty moderation state', function () {
    const { state } = createState();

    assert.deepStrictEqual(state.getSnapshot(), {
      subonly: { tier: 0 },
      nukes: [],
      mutelinks: { mode: 'off' },
      breakingnews: { mode: 'off' },
      nukedUsers: [],
      timestamp: 1770000000000,
    });
  });

  it('applies a snapshot and prunes expired entries', function () {
    const { state } = createState();

    state.applySnapshot({
      subonly: { tier: 2 },
      nukes: [
        {
          key: 'plain:active',
          phrase: 'Active',
          regex: false,
          duration: 600,
          mega: false,
          addedAt: 1769999999000,
          expiresAt: 1770000100000,
        },
        {
          key: 'plain:expired',
          phrase: 'Expired',
          regex: false,
          duration: 600,
          mega: false,
          addedAt: 1769999000000,
          expiresAt: 1769999999000,
        },
        {
          key: 'regex:(',
          phrase: '(',
          regex: true,
          duration: 600,
          mega: false,
          addedAt: 1769999999000,
          expiresAt: 1770000100000,
        },
        {
          key: 'plain:too-long',
          phrase: 'TooLong',
          regex: false,
          duration: 99999999,
          mega: false,
          addedAt: 1769999999000,
          expiresAt: 1770000100000,
        },
      ],
      mutelinks: { mode: 'all', duration: 120, changedBy: 'Mod' },
      breakingnews: { mode: 'on', maxAge: 300, mention: 'Mod' },
      nukedUsers: [
        { id: 1, nick: 'ActiveUser', nukeKey: 'plain:active', expiresAt: 1770000100000 },
        { id: 2, nick: 'ExpiredUser', nukeKey: 'plain:expired', expiresAt: 1769999999000 },
      ],
      timestamp: 1769999999500,
    });

    const snapshot = state.getSnapshot();
    assert.deepStrictEqual(snapshot.subonly, { tier: 2 });
    assert.deepStrictEqual(
      snapshot.nukes.map((nuke) => nuke.phrase),
      ['Active'],
    );
    assert.deepStrictEqual(
      snapshot.nukedUsers.map((victim) => victim.nick),
      ['ActiveUser'],
    );
    assert.deepStrictEqual(snapshot.mutelinks, {
      mode: 'all',
      duration: 120,
      changedBy: 'Mod',
    });
    assert.deepStrictEqual(state.mutelinks.mode, 'all');
    assert.deepStrictEqual(state.breakingnews.mention, 'Mod');
  });

  it('returns copies from a snapshot', function () {
    const { state } = createState();
    state.addNuke({ phrase: 'Test', victims: [{ id: 1, nick: 'User' }] });

    const snapshot = state.getSnapshot();
    snapshot.nukes.push({ phrase: 'Injected' });
    snapshot.nukedUsers[0].nick = 'Changed';

    assert.strictEqual(state.getNukes().length, 1);
    assert.strictEqual(state.getNukedUsers()[0].nick, 'User');
  });

  it('adds a nuke, publishes it, and replaces by canonical key', function () {
    const { state, published } = createState();

    state.addNuke({ phrase: 'KING MOUTON', duration: 600, by: 'Mod' });
    state.addNuke({ phrase: ' king mouton ', duration: 900, mega: true, by: 'OtherMod' });

    const snapshot = state.getSnapshot();
    assert.strictEqual(snapshot.nukes.length, 1);
    assert.deepStrictEqual(snapshot.nukes[0], {
      key: 'plain:king mouton',
      phrase: 'king mouton',
      regex: false,
      duration: 900,
      mega: true,
      addedBy: 'OtherMod',
      addedAt: 1770000000000,
      expiresAt: 1770000300000,
    });
    assert.deepStrictEqual(published[0], {
      event: 'NUKE',
      payload: {
        phrase: 'KING MOUTON',
        regex: false,
        duration: 600,
        mega: false,
        by: 'Mod',
        victims: [],
      },
    });
  });

  it('rejects empty phrases and invalid regexes', function () {
    const { state } = createState();

    assert.throws(() => state.addNuke({ phrase: '   ' }), /cannot be empty/);
    assert.throws(() => state.addNuke({ phrase: '(', regex: true }), SyntaxError);
    assert.strictEqual(state.getNukes().length, 0);
  });

  it('matches plain phrases with word boundaries and regex patterns case-insensitively', function () {
    const { state } = createState();
    state.addNuke({ phrase: 'test', duration: 100 });
    state.addNuke({ phrase: 'n.+ke', regex: true, duration: 200 });

    assert.strictEqual(state.matchNuke('this is a TEST').duration, 100);
    assert.strictEqual(state.matchNuke('testing is not a match'), null);
    assert.strictEqual(state.matchNuke('a NUKE appears').duration, 200);
  });

  it('returns the longest matching nuke and treats any mega match as mega', function () {
    const { state } = createState();
    state.addNuke({ phrase: 'short', duration: 100 });
    state.addNuke({ phrase: 'long', duration: 500 });
    state.addNuke({ phrase: 'mega', duration: 50, mega: true });

    const match = state.matchNuke('short long mega');
    assert.strictEqual(match.phrase, 'long');
    assert.strictEqual(match.duration, 500);
    assert.strictEqual(match.mega, true);
  });

  it('ignores expired nukes and victims independently', function () {
    const { state } = createState({ nukeLingerSeconds: 5 });
    state.addNuke({ phrase: 'one', duration: 600, victims: [{ id: 1, nick: 'User' }] });

    this.clock.tick(5001);

    assert.strictEqual(state.matchNuke('one'), null);
    assert.deepStrictEqual(state.getNukes(), []);
    // The victim's mute outlives the nuke phrase's linger.
    assert.strictEqual(state.getNukedUsers().length, 1);

    this.clock.tick(600000);
    assert.deepStrictEqual(state.getNukedUsers(), []);
  });

  it('adds victims by id or nick, replacing older records', function () {
    const { state, published } = createState();
    const nuke = state.addNuke({ phrase: 'one', duration: 600 });
    state.addNukeVictims(nuke, [{ id: 1, nick: 'User' }]);
    state.addNukeVictims(nuke, [{ id: 1, nick: 'Renamed' }]);
    state.addNukeVictims(nuke, [{ id: 0, nick: 'NickOnly' }]);
    state.addNukeVictims(nuke, [{ id: 0, nick: 'nickonly' }]);

    const victims = state.getNukedUsers({ phrase: 'one' });
    assert.strictEqual(victims.length, 2);
    assert.deepStrictEqual(victims[0], {
      id: 1,
      nick: 'Renamed',
      nukeKey: 'plain:one',
      mega: false,
      expiresAt: 1770000600000,
    });
    assert.strictEqual(victims[1].nick, 'nickonly');
    assert.deepStrictEqual(published[1], {
      event: 'NUKEVICTIM',
      payload: {
        phrase: 'one',
        regex: false,
        victims: [{ id: 1, nick: 'User' }],
      },
    });
  });

  it('does not publish victims for a missing or expired nuke', function () {
    const { state, published } = createState({ nukeLingerSeconds: 1 });
    const nuke = state.addNuke({ phrase: 'one', duration: 600 });
    this.clock.tick(1001);

    assert.deepStrictEqual(state.addNukeVictims(nuke, [{ id: 1, nick: 'User' }]), []);
    assert.strictEqual(published.length, 1);
  });

  it('removes a single nuke and optionally its victims', function () {
    const { state, published } = createState();
    state.addNuke({ phrase: 'one', duration: 600, victims: [{ id: 1, nick: 'User' }] });
    state.addNuke({ phrase: 'two', duration: 600 });
    state.removeNuke({ phrase: 'one', clearVictims: false });

    assert.deepStrictEqual(
      state.getNukes().map((nuke) => nuke.phrase),
      ['two'],
    );
    assert.strictEqual(state.getNukedUsers().length, 1);
    assert.deepStrictEqual(published[published.length - 1], {
      event: 'REMOVENUKE',
      payload: { phrase: 'one', regex: false, clearVictims: false },
    });

    state.removeNuke({ phrase: 'two', clearVictims: true });
    assert.deepStrictEqual(state.getNukes(), []);
  });

  it('clears every nuke and victim', function () {
    const { state, published } = createState();
    state.addNuke({ phrase: 'one', duration: 600, victims: [{ id: 1, nick: 'User' }] });
    state.clearNukes();

    assert.deepStrictEqual(state.getNukes(), []);
    assert.deepStrictEqual(state.getNukedUsers(), []);
    assert.deepStrictEqual(published[published.length - 1], {
      event: 'REMOVENUKE',
      payload: { phrase: '', regex: false, clearVictims: true },
    });
  });

  it('stores mutelinks mode and derives the mention from the moderator', function () {
    const { state, published } = createState();

    state.setMuteLinks({ mode: 'on', by: 'Mod' });
    assert.deepStrictEqual(state.mutelinks, {
      mode: 'on',
      duration: 60,
      changedBy: 'Mod',
      mention: 'Mod',
      timestamp: 1770000000000,
    });
    assert.deepStrictEqual(published[0], {
      event: 'MUTELINKS',
      payload: { mode: 'on', duration: 60, by: 'Mod' },
    });

    state.setMuteLinks({ mode: 'repeated', duration: 120, by: 'Mod' });
    assert.strictEqual(state.mutelinks.mode, 'repeat');
    assert.strictEqual(state.mutelinks.mention, undefined);

    state.setMuteLinks({ mode: 'off', by: 'Mod' });
    assert.strictEqual(state.mutelinks.mode, 'off');
    assert.strictEqual(state.mutelinks.mention, undefined);
  });

  it('validates mutelinks and breaking news values', function () {
    const { state } = createState();

    assert.throws(() => state.setMuteLinks({ mode: 'invalid' }), /Invalid mutelinks mode/);
    assert.throws(() => state.setMuteLinks({ mode: 'all', duration: 86401 }), /out of range/);
    assert.throws(() => state.setBreakingNews({ mode: 'repeat' }), /Invalid breaking news mode/);
    assert.throws(() => state.setBreakingNews({ mode: 'all', maxAge: 604801 }), /out of range/);
  });

  it('stores breaking news mode and derives the mention from the moderator', function () {
    const { state, published } = createState();

    state.setBreakingNews({ mode: 'on', by: 'Mod' });
    assert.deepStrictEqual(state.breakingnews, {
      mode: 'on',
      maxAge: 300,
      changedBy: 'Mod',
      mention: 'Mod',
      timestamp: 1770000000000,
    });
    assert.deepStrictEqual(published[0], {
      event: 'BREAKINGNEWS',
      payload: { mode: 'on', maxAge: 300, by: 'Mod' },
    });

    state.setBreakingNews({ mode: 'all', maxAge: 500, by: 'Mod' });
    assert.strictEqual(state.breakingnews.mode, 'all');
    assert.strictEqual(state.breakingnews.mention, undefined);
  });

  it('stores and returns the sub-only tier', function () {
    const { state } = createState();
    state.setSubModeTier(3);

    assert.strictEqual(state.getSubModeTier(), 3);
    assert.deepStrictEqual(state.getSnapshot().subonly, { tier: 3 });
  });

  it('caps the number of stored nukes by evicting the oldest', function () {
    const { state } = createState();

    for (let i = 0; i < 101; i += 1) {
      state.addNuke({ phrase: `nuke-${i}` });
      this.clock.tick(1);
    }

    const nukes = state.getNukes();
    assert.strictEqual(nukes.length, 100);
    assert.strictEqual(nukes[0].phrase, 'nuke-1');
    assert.strictEqual(nukes[99].phrase, 'nuke-100');
  });
});
