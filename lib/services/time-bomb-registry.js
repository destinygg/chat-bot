class TimeBombRegistry {
  constructor(config) {
    this.defaultBombDelay = config.defaultBombDelaySeconds || 60;
    this.bombs = {};
  }

  arm(bombCallback, user, delay) {
    // bomb is the payload to be executed
    const id = setTimeout(() => {
      if (!this.bombs[user]) {
        // should never happen (the bomb got defused but the timeout was not cleared)
        return;
      }
      bombCallback();
      delete this.bombs[user];
    }, 1000*(delay || this.defaultBombDelay));
    
    this.bombs[user.toLowerCase()] = id;
  }

  hasBomb(user) {
    return this.bombs[user.toLowerCase()] !== undefined;
  }

  defuse(user) {
    if (!user) {
      return this.defuseAll();
    }

    user = user.toLowerCase();

    const bombId = this.bombs[user];
    if (!bombId) {
      return;
    }
    clearTimeout(bombId);
    delete this.bombs[user];
  }

  defuseAll() {
    Object.values(this.bombs).forEach(b => {
      clearTimeout(b);
    });
    this.bombs = {};
  }
}

module.exports = TimeBombRegistry;
