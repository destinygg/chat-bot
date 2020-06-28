class TimeBombRegistry {
  constructor(config) {
    this.defaultBombDelay = config.defaultBombDelaySeconds || 60;
    this.bombs = [];
  }

  arm(bomb, user, delay) {
    // bomb is the payload to be executed
    const id = setTimeout(() => {
      const index = this.bombs.findIndex(b => b.id == id);
      if (index < 0) {
        // should never happen (the bomb got defused but the timeout was not cleared)
        return;
      }
      bomb();
      this.bombs.splice(index, 1);
    }, 1000*(delay || this.defaultBombDelay));
    
    this.bombs.push({
      id,
      user: user.toLowerCase(),
    })
  }

  hasBomb(user) {
    return this.bombs.find(b => b.user == user.toLowerCase()) !== undefined;
  }

  defuse(user) {
    if (!user) {
      return this.defuseAll();
    }
    
    this.bombs = this.bombs.filter(b => {
      if (b.user == user.toLowerCase()) {
        clearTimeout(b.id);
        return false;
      }
      return true;
    });
  }

  defuseAll() {
    this.bombs.map(b => {
      clearTimeout(b.id);
    });
    this.bombs = [];
  }
}

module.exports = TimeBombRegistry;
