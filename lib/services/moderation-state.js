const EventEmitter = require('events');
const _ = require('lodash');

const DEFAULT_NUKE_DURATION_SECONDS = 600;
const DEFAULT_MUTE_LINKS_DURATION_SECONDS = 60;
const DEFAULT_BREAKING_NEWS_MAX_AGE_SECONDS = 300;
const DEFAULT_NUKE_LINGER_SECONDS = 300;
const MAX_NUKE_DURATION_SECONDS = 30 * 24 * 60 * 60;
const MAX_MUTE_LINKS_DURATION_SECONDS = 24 * 60 * 60;
const MAX_BREAKING_NEWS_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const MAX_NUKES = 100;
const MAX_NUKED_USERS = 2000;
const MUTE_LINKS_MODES = ['off', 'on', 'all', 'repeat'];
const BREAKING_NEWS_MODES = ['off', 'on', 'all'];

function nukeKey({ phrase, regex }) {
  const trimmedPhrase = String(phrase || '').trim();
  return regex ? `regex:${trimmedPhrase}` : `plain:${trimmedPhrase.toLowerCase()}`;
}

function compileNukeMatcher({ phrase, regex }) {
  const trimmedPhrase = String(phrase || '').trim();
  if (trimmedPhrase === '') {
    throw new Error('Nuke phrase cannot be empty');
  }

  if (regex) {
    return new RegExp(trimmedPhrase, 'i');
  }

  return new RegExp(`\\b${_.escapeRegExp(trimmedPhrase)}\\b`, 'i');
}

function normalizeNukeDuration(duration) {
  if (duration === undefined || duration === null || duration === 0) {
    return DEFAULT_NUKE_DURATION_SECONDS;
  }

  if (!Number.isFinite(duration) || duration < 0 || duration > MAX_NUKE_DURATION_SECONDS) {
    throw new Error('Nuke duration is out of range');
  }

  return Math.floor(duration);
}

function normalizeMuteLinksMode(mode) {
  const normalizedMode = String(mode || 'off').toLowerCase();
  const resolvedMode = normalizedMode === 'repeated' ? 'repeat' : normalizedMode;
  if (!MUTE_LINKS_MODES.includes(resolvedMode)) {
    throw new Error('Invalid mutelinks mode');
  }
  return resolvedMode;
}

function normalizeBreakingNewsMode(mode) {
  const normalizedMode = String(mode || 'off').toLowerCase();
  if (!BREAKING_NEWS_MODES.includes(normalizedMode)) {
    throw new Error('Invalid breaking news mode');
  }
  return normalizedMode;
}

function normalizeDuration(duration, defaultDuration, maxDuration) {
  if (duration === undefined || duration === null || duration === 0) {
    return defaultDuration;
  }

  if (!Number.isFinite(duration) || duration < 0 || duration > maxDuration) {
    throw new Error('Duration is out of range');
  }

  return Math.floor(duration);
}

function normalizeVictim(victim) {
  const id = Number(_.get(victim, 'id', 0));
  const nick = String(_.get(victim, 'nick', '')).trim();
  if (!id && nick === '') {
    return null;
  }

  return {
    id: Number.isFinite(id) ? id : 0,
    nick,
  };
}

function sameVictim(left, right) {
  if (left.id && right.id) {
    return left.id === right.id;
  }

  return left.nick.toLowerCase() === right.nick.toLowerCase();
}

class ModerationState extends EventEmitter {
  constructor(config = {}, logger = null) {
    super();
    this.logger = logger;
    this.nukeLingerSeconds = _.get(config, 'nukeLingerSeconds', DEFAULT_NUKE_LINGER_SECONDS);
    this.publisher = null;
    this.timestamp = Date.now();
    this.subonly = { tier: 0 };
    this.nukes = [];
    this.mutelinks = { mode: 'off' };
    this.breakingnews = { mode: 'off' };
    this.nukedUsers = [];
    this.compiledNukes = new Map();
  }

  setPublisher(publisher) {
    this.publisher = typeof publisher === 'function' ? publisher : null;
  }

  applySnapshot(snapshot = {}) {
    const now = Date.now();
    this.subonly = { tier: Number(_.get(snapshot, 'subonly.tier', 0)) || 0 };
    this.nukes = (Array.isArray(snapshot.nukes) ? snapshot.nukes : [])
      .map((nuke) => this.normalizeNuke(nuke, now))
      .filter((nuke) => nuke && this.isActive(nuke.expiresAt, now));
    this.nukedUsers = (Array.isArray(snapshot.nukedUsers) ? snapshot.nukedUsers : [])
      .map((victim) => this.normalizeNukedUser(victim))
      .filter((victim) => victim && this.isActive(victim.expiresAt, now));
    this.mutelinks = this.normalizeMuteLinksState(snapshot.mutelinks);
    this.breakingnews = this.normalizeBreakingNewsState(snapshot.breakingnews);
    this.timestamp = Number(snapshot.timestamp) || now;
    this.rebuildMatchers();
    this.emitChange();
  }

  getSnapshot() {
    return {
      subonly: { ...this.subonly },
      nukes: this.nukes.map((nuke) => ({ ...nuke })),
      mutelinks: { ...this.mutelinks },
      breakingnews: { ...this.breakingnews },
      nukedUsers: this.nukedUsers.map((victim) => ({ ...victim })),
      timestamp: this.timestamp,
    };
  }

  snapshot() {
    return this.getSnapshot();
  }

  getSubModeTier() {
    return this.subonly.tier;
  }

  setSubModeTier(tier) {
    const normalizedTier = Number(tier) || 0;
    if (this.subonly.tier === normalizedTier) {
      return;
    }

    this.subonly = { tier: normalizedTier };
    this.touch();
  }

  addNuke({ phrase, regex = false, duration, mega = false, by = '', victims = [] } = {}) {
    const normalizedPhrase = String(phrase || '').trim();
    const normalizedRegex = Boolean(regex);
    const normalizedDuration = normalizeNukeDuration(duration);
    // Validate the matcher before mutating anything.
    compileNukeMatcher({ phrase: normalizedPhrase, regex: normalizedRegex });

    const now = Date.now();
    const key = nukeKey({ phrase: normalizedPhrase, regex: normalizedRegex });
    const nuke = {
      key,
      phrase: normalizedPhrase,
      regex: normalizedRegex,
      duration: normalizedDuration,
      mega: Boolean(mega),
      addedBy: by || '',
      addedAt: now,
      expiresAt: now + this.nukeLingerSeconds * 1000,
    };

    this.nukes = this.nukes.filter((existingNuke) => existingNuke.key !== key);
    this.nukes.push(nuke);
    this.enforceNukeCap();

    const normalizedVictims = this.addVictimsToState(nuke, victims, now);
    this.rebuildMatchers();
    this.touch();
    this.publish('NUKE', {
      phrase: nuke.phrase,
      regex: nuke.regex,
      duration: nuke.duration,
      mega: nuke.mega,
      by: nuke.addedBy,
      victims: normalizedVictims,
    });

    return { ...nuke };
  }

  addNukeVictims(nuke, victims = []) {
    const key = _.get(nuke, 'key') || nukeKey(nuke || {});
    const storedNuke = this.nukes.find((existingNuke) => existingNuke.key === key);
    const now = Date.now();
    if (!storedNuke || !this.isActive(storedNuke.expiresAt, now)) {
      return [];
    }

    const normalizedVictims = this.addVictimsToState(storedNuke, victims, now);
    if (normalizedVictims.length === 0) {
      return [];
    }

    this.touch();
    this.publish('NUKEVICTIM', {
      phrase: storedNuke.phrase,
      regex: storedNuke.regex,
      victims: normalizedVictims,
    });

    return normalizedVictims;
  }

  removeNuke({ phrase, regex = false, clearVictims = false } = {}) {
    if (String(phrase || '').trim() === '') {
      this.clearNukes();
      return;
    }

    const normalizedPhrase = String(phrase).trim();
    const normalizedRegex = Boolean(regex);
    const key = nukeKey({ phrase: normalizedPhrase, regex: normalizedRegex });
    this.nukes = this.nukes.filter((nuke) => nuke.key !== key);
    if (clearVictims) {
      this.nukedUsers = this.nukedUsers.filter((victim) => victim.nukeKey !== key);
    }

    this.rebuildMatchers();
    this.touch();
    this.publish('REMOVENUKE', {
      phrase: normalizedPhrase,
      regex: normalizedRegex,
      clearVictims: Boolean(clearVictims),
    });
  }

  clearNukes() {
    this.nukes = [];
    this.nukedUsers = [];
    this.rebuildMatchers();
    this.touch();
    this.publish('REMOVENUKE', {
      phrase: '',
      regex: false,
      clearVictims: true,
    });
  }

  setMuteLinks({ mode, duration, by = '' } = {}) {
    const normalizedMode = normalizeMuteLinksMode(mode);
    const normalizedDuration = normalizeDuration(
      duration,
      DEFAULT_MUTE_LINKS_DURATION_SECONDS,
      MAX_MUTE_LINKS_DURATION_SECONDS,
    );
    const state = {
      mode: normalizedMode,
      duration: normalizedDuration,
      changedBy: by || '',
      timestamp: Date.now(),
    };

    if (normalizedMode === 'on') {
      state.mention = by || '';
    }

    this.mutelinks = state;
    this.touch();
    this.publish('MUTELINKS', {
      mode: normalizedMode,
      duration: normalizedDuration,
      by: by || '',
    });

    return { ...state };
  }

  setBreakingNews({ mode, maxAge, by = '' } = {}) {
    const normalizedMode = normalizeBreakingNewsMode(mode);
    const normalizedMaxAge = normalizeDuration(
      maxAge,
      DEFAULT_BREAKING_NEWS_MAX_AGE_SECONDS,
      MAX_BREAKING_NEWS_MAX_AGE_SECONDS,
    );
    const state = {
      mode: normalizedMode,
      maxAge: normalizedMaxAge,
      changedBy: by || '',
      timestamp: Date.now(),
    };

    if (normalizedMode === 'on') {
      state.mention = by || '';
    }

    this.breakingnews = state;
    this.touch();
    this.publish('BREAKINGNEWS', {
      mode: normalizedMode,
      maxAge: normalizedMaxAge,
      by: by || '',
    });

    return { ...state };
  }

  matchNuke(message) {
    this.pruneExpired();
    let matchedNuke = null;
    let matchedMega = false;

    this.nukes.forEach((nuke) => {
      const matcher = this.compiledNukes.get(nuke.key);
      if (!matcher || !matcher.test(message)) {
        return;
      }

      matchedMega = matchedMega || nuke.mega;
      if (!matchedNuke || nuke.duration > matchedNuke.duration) {
        matchedNuke = nuke;
      }
    });

    if (!matchedNuke) {
      return null;
    }

    return { ...matchedNuke, mega: matchedNuke.mega || matchedMega };
  }

  getNukes() {
    this.pruneExpired();
    return this.nukes.map((nuke) => ({ ...nuke }));
  }

  findNuke({ phrase, regex = false } = {}) {
    this.pruneExpired();
    const key = nukeKey({ phrase, regex });
    const nuke = this.nukes.find((existingNuke) => existingNuke.key === key);
    return nuke ? { ...nuke } : null;
  }

  getNukedUsers(filter) {
    this.pruneExpired();
    if (!filter) {
      return this.nukedUsers.map((victim) => ({ ...victim }));
    }

    const key = nukeKey(filter);
    return this.nukedUsers
      .filter((victim) => victim.nukeKey === key)
      .map((victim) => ({ ...victim }));
  }

  pruneExpired(now = Date.now()) {
    const nukeCount = this.nukes.length;
    const victimCount = this.nukedUsers.length;
    this.nukes = this.nukes.filter((nuke) => this.isActive(nuke.expiresAt, now));
    this.nukedUsers = this.nukedUsers.filter((victim) => this.isActive(victim.expiresAt, now));

    if (this.nukes.length !== nukeCount) {
      this.rebuildMatchers();
    }

    return this.nukes.length !== nukeCount || this.nukedUsers.length !== victimCount;
  }

  normalizeNuke(nuke, now) {
    const normalizedPhrase = String(_.get(nuke, 'phrase', '')).trim();
    const normalizedRegex = Boolean(_.get(nuke, 'regex', false));
    try {
      compileNukeMatcher({ phrase: normalizedPhrase, regex: normalizedRegex });
    } catch (error) {
      this.log('warn', 'Dropping invalid nuke from moderation state', {
        phrase: normalizedPhrase,
        error,
      });
      return null;
    }

    let normalizedDuration;
    try {
      normalizedDuration = normalizeNukeDuration(_.get(nuke, 'duration'));
    } catch (error) {
      this.log('warn', 'Dropping nuke with invalid duration from moderation state', {
        phrase: normalizedPhrase,
        error,
      });
      return null;
    }

    return {
      key: nuke.key || nukeKey({ phrase: normalizedPhrase, regex: normalizedRegex }),
      phrase: normalizedPhrase,
      regex: normalizedRegex,
      duration: normalizedDuration,
      mega: Boolean(_.get(nuke, 'mega', false)),
      addedBy: _.get(nuke, 'addedBy', ''),
      addedAt: Number(_.get(nuke, 'addedAt', now)) || now,
      expiresAt: Number(_.get(nuke, 'expiresAt', 0)),
    };
  }

  normalizeNukedUser(victim) {
    const normalizedVictim = normalizeVictim(victim);
    if (!normalizedVictim) {
      return null;
    }

    return {
      ...normalizedVictim,
      nukeKey: _.get(victim, 'nukeKey', ''),
      mega: Boolean(_.get(victim, 'mega', false)),
      expiresAt: Number(_.get(victim, 'expiresAt', 0)),
    };
  }

  normalizeMuteLinksState(state) {
    if (!state || !state.mode) {
      return { mode: 'off' };
    }

    try {
      const normalizedMode = normalizeMuteLinksMode(state.mode);
      return {
        ...state,
        mode: normalizedMode,
        duration: Number(state.duration) || DEFAULT_MUTE_LINKS_DURATION_SECONDS,
      };
    } catch (_error) {
      return { mode: 'off' };
    }
  }

  normalizeBreakingNewsState(state) {
    if (!state || !state.mode) {
      return { mode: 'off' };
    }

    try {
      const normalizedMode = normalizeBreakingNewsMode(state.mode);
      return {
        ...state,
        mode: normalizedMode,
        maxAge: Number(state.maxAge) || DEFAULT_BREAKING_NEWS_MAX_AGE_SECONDS,
      };
    } catch (_error) {
      return { mode: 'off' };
    }
  }

  addVictimsToState(nuke, victims, now) {
    const normalizedVictims = victims.map(normalizeVictim).filter((victim) => victim !== null);

    normalizedVictims.forEach((victim) => {
      const storedVictim = {
        ...victim,
        nukeKey: nuke.key,
        mega: nuke.mega,
        expiresAt: now + nuke.duration * 1000,
      };
      const existingIndex = this.nukedUsers.findIndex((existingVictim) =>
        sameVictim(existingVictim, storedVictim),
      );
      if (existingIndex === -1) {
        this.nukedUsers.push(storedVictim);
      } else {
        this.nukedUsers[existingIndex] = storedVictim;
      }
    });

    this.enforceNukedUserCap(now);
    return normalizedVictims;
  }

  enforceNukeCap() {
    if (this.nukes.length <= MAX_NUKES) {
      return;
    }

    this.nukes.sort((a, b) => a.addedAt - b.addedAt);
    this.nukes = this.nukes.slice(this.nukes.length - MAX_NUKES);
    this.log('warn', 'Nuke cap reached, evicting the oldest nuke');
  }

  enforceNukedUserCap(now) {
    if (this.nukedUsers.length <= MAX_NUKED_USERS) {
      return;
    }

    this.nukedUsers = this.nukedUsers.filter((victim) => this.isActive(victim.expiresAt, now));
    if (this.nukedUsers.length > MAX_NUKED_USERS) {
      this.nukedUsers.sort((a, b) => a.expiresAt - b.expiresAt);
      this.nukedUsers = this.nukedUsers.slice(this.nukedUsers.length - MAX_NUKED_USERS);
    }
    this.log('warn', 'Nuked user cap reached, evicting the oldest victims');
  }

  rebuildMatchers() {
    this.compiledNukes = new Map();
    this.nukes.forEach((nuke) => {
      try {
        this.compiledNukes.set(
          nuke.key,
          compileNukeMatcher({ phrase: nuke.phrase, regex: nuke.regex }),
        );
      } catch (error) {
        this.log('warn', 'Unable to compile nuke matcher', { nuke, error });
      }
    });
  }

  isActive(expiresAt, now) {
    const timestamp = Number(expiresAt);
    return !Number.isFinite(timestamp) || timestamp <= 0 || timestamp > now;
  }

  touch() {
    this.timestamp = Date.now();
    this.emitChange();
  }

  emitChange() {
    this.emit('change', this.getSnapshot());
  }

  publish(event, payload) {
    if (!this.publisher) {
      return;
    }

    try {
      this.publisher(event, payload);
    } catch (error) {
      this.log('warn', 'Unable to publish moderation state', { event, error });
    }
  }

  log(level, message, metadata) {
    if (!this.logger || typeof this.logger[level] !== 'function') {
      return;
    }
    this.logger[level](metadata, message);
  }
}

ModerationState.nukeKey = nukeKey;
ModerationState.compileNukeMatcher = compileNukeMatcher;
ModerationState.DEFAULT_NUKE_DURATION_SECONDS = DEFAULT_NUKE_DURATION_SECONDS;
ModerationState.DEFAULT_MUTE_LINKS_DURATION_SECONDS = DEFAULT_MUTE_LINKS_DURATION_SECONDS;
ModerationState.DEFAULT_BREAKING_NEWS_MAX_AGE_SECONDS = DEFAULT_BREAKING_NEWS_MAX_AGE_SECONDS;

module.exports = ModerationState;
