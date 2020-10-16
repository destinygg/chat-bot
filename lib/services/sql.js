const Sqlite = require('sqlite3');

/**
 * @param {function(T=) : void} a
 * @param {function(any) : void} r
 * @template T
 */
function handleSimpleCallback(a, r) {
  return (err) => (err ? r(err) : a());
}

class Sql {
  constructor(config) {
    this.config = config;
    this.db = null;
  }

  /**
   * @returns {Promise<this>}
   */
  createConnection() {
    return new Promise((accept, reject) => {
      this.db = new Sqlite.Database(
        this.config.fileLocation || `${__dirname}/../../storage.db`,
        (err) => {
          if (err) {
            return reject(err);
          }
          return accept(this);
        },
      );
    });
  }

  init() {
    return new Promise((accept, reject) => {
      this.db.exec(
        `CREATE TABLE IF NOT EXISTS commands (
      cmd_id       INTEGER PRIMARY KEY,
      cmd_key      TEXT,
      cmd_message  TEXT NOT NULL,
      UNIQUE(cmd_key));
      
      CREATE TABLE IF NOT EXISTS banned_words (
      banned_id       INTEGER PRIMARY KEY,
      banned_text     TEXT,
      banned_type     TEXT,
      banned_duration INTEGER,
      UNIQUE(banned_text));
      
      CREATE TABLE IF NOT EXISTS duo (
      duo_id   INTEGER,
      duo_text TEXT NOT NULL,
      UNIQUE(duo_id));
      
      CREATE TABLE IF NOT EXISTS deaths (
      death_id INTEGER PRIMARY KEY,
      death_count INTEGER DEFAULT 0,
      last_update INTEGER DEFAULT (strftime('%s', 'now')));
      
      CREATE TABLE IF NOT EXISTS scheduled_commands (
      sch_id       INTEGER PRIMARY KEY,
      sch_cmd_id   INTEGER REFERENCES commands (cmd_id) ON DELETE CASCADE);
      
      CREATE TABLE IF NOT EXISTS twitch_time(
      word TEXT PRIMARY KEY, 
      timestamp INT);
           
      `,
        handleSimpleCallback(accept, reject),
      );
    });
  }

  /**
   * @param {number} updateLength
   */
  incrementDeaths(updateLength) {
    return new Promise((accept, reject) => {
      const statement = this.db.prepare(`
      INSERT INTO deaths(death_id, death_count) VALUES(1, 1)
      ON CONFLICT(death_id) DO UPDATE SET 
      death_count=death_count+1,
      last_update = strftime('%s', 'now')
      WHERE excluded.last_update - ? >= last_update
        `);
      statement.run(updateLength, handleSimpleCallback(accept, reject));
    });
  }

  /**
   * @param {string} deathSetTo
   */
  setDeaths(deathSetTo) {
    return new Promise((accept, reject) => {
      const statement = this.db.prepare(`
      INSERT INTO deaths(death_id, death_count) VALUES(1, ?)
      ON CONFLICT(death_id) DO UPDATE SET death_count=?
        `);
      statement.run(deathSetTo, deathSetTo, handleSimpleCallback(accept, reject));
    });
  }

  /**
   * @returns {Promise<number | false>}
   */
  getDeaths() {
    return new Promise((accept, reject) => {
      const statement = this.db.prepare(`
      SELECT * FROM deaths WHERE death_id = ?`);
      statement.all(1, (err, rows) => {
        if (err) {
          return reject(err);
        }
        if (rows.length === 1) {
          return accept(rows[0].death_count);
        }
        return accept(false);
      });
    });
  }

  /**
   * @param {string} duoText
   */
  updateDuo(duoText) {
    return new Promise((accept, reject) => {
      const statement = this.db.prepare(`
      INSERT INTO duo(duo_text, duo_id) VALUES(?,?)
      ON CONFLICT(duo_id) DO UPDATE SET duo_text=excluded.duo_text;);`);

      statement.run(duoText, 1, handleSimpleCallback(accept, reject));
    });
  }

  /**
   * @returns {Promise<string | false>}
   */
  getDuoText() {
    return new Promise((accept, reject) => {
      const statement = this.db.prepare(`
      SELECT * FROM duo 
      WHERE duo_id = ?`);
      statement.all(1, (err, rows) => {
        if (err) {
          return reject(err);
        }
        if (rows.length === 1) {
          return accept(rows[0].duo_text);
        }
        return accept(false);
      });
    });
  }

  /**
   * @param {string} word
   * @param {number} timeStamp
   */
  addTwitchTimestamp(word, timeStamp) {
    return new Promise((accept, reject) => {
      const statement = this.db.prepare(`
      INSERT INTO twitch_time(word, timestamp) VALUES(?,?)
      ON CONFLICT(word) DO UPDATE SET timestamp=excluded.timestamp;);`);

      statement.run(word, timeStamp, handleSimpleCallback(accept, reject));
    });
  }

  /**
   * @param {string} word
   */
  getTwitchTimestamp(word) {
    return new Promise((accept, reject) => {
      const statement = this.db.prepare(`
      SELECT * FROM twitch_time 
      WHERE word = ?`);
      statement.all(word, (err, rows) => {
        if (err) {
          return reject(err);
        }
        if (rows.length === 1) {
          return accept(rows[0].timestamp);
        }
        return accept(false);
      });
    });
  }

  /**
   * @param {string} commandString
   * @param {string} output
   */
  addCommand(commandString, output) {
    return new Promise((accept, reject) => {
      const statement = this.db.prepare(`
      INSERT INTO commands 
      (cmd_key, cmd_message) 
      VALUES (?, ?)`);

      statement.run(commandString, output, handleSimpleCallback(accept, reject));
    });
  }

  /**
   * @param {string} commandString
   */
  deleteCommand(commandString) {
    return this.doesCommandExist(commandString).then((doesExist) => {
      if (doesExist) {
        return this.internalDeleteCommand(commandString);
      }
      return Promise.reject(new Error('Command does not exist'));
    });
  }

  /**
   * @param {string} commandString
   */
  internalDeleteCommand(commandString) {
    return new Promise((accept, reject) => {
      const statement = this.db.prepare(`
            DELETE FROM commands 
            WHERE cmd_key = ?`);
      return statement.run(commandString, handleSimpleCallback(accept, reject));
    });
  }

  /**
   * @param {string} commandString
   * @returns {Promise<boolean>}
   */
  doesCommandExist(commandString) {
    return new Promise((accept, reject) => {
      const statement = this.db.prepare(`
      SELECT * FROM commands 
      WHERE cmd_key = ?`);
      statement.all(commandString, (err, rows) => {
        if (err) {
          return reject(err);
        }
        if (rows.length === 1) {
          return accept(true);
        }
        return accept(false);
      });
    });
  }

  /**
   * @param {string} commandString
   * @returns {Promise<any | false>}
   */
  getCommandObject(commandString) {
    return new Promise((accept, reject) => {
      const statement = this.db.prepare(`
      SELECT * FROM commands 
      WHERE cmd_key = ?`);
      statement.all(commandString, (err, rows) => {
        if (err) {
          return reject(err);
        }
        if (rows.length === 1) {
          return accept(rows[0]);
        }
        return accept(false);
      });
    });
  }

  /**
   * @return {Promise<string>}
   */
  listCommands() {
    return new Promise((accept, reject) => {
      this.db.all('select * from commands', (err, rows) => {
        if (err) {
          return reject(err);
        }
        if (rows.length > 0) {
          return accept(
            rows
              .map((row) => row.cmd_key)
              .join(',')
              .trim(),
          );
        }
        return reject(new Error('No commands'));
      });
    });
  }

  /**
   * @returns {Promise<any[]>}
   */
  getCommands() {
    return new Promise((accept, reject) => {
      this.db.all('SELECT * FROM commands', (err, rows) => {
        if (err) {
          return reject(err);
        }
        if (rows.length > 0) {
          return accept(rows);
        }
        return reject(new Error('No commands found.'));
      });
    });
  }

  /**
   * @param {string} bannedPhrase
   * @param {number} duration
   * @param {string} type
   */
  addBannedPhrase(bannedPhrase, duration, type) {
    return new Promise((accept, reject) => {
      const statement = this.db.prepare(`
      INSERT INTO banned_words 
      (banned_text, banned_duration, banned_type) 
      VALUES (?, ?, ?)`);

      statement.run(bannedPhrase, duration, type, handleSimpleCallback(accept, reject));
    });
  }

  /**
   * @typedef BannedPhrase
   * @type {Object}
   * @property {string} text
   * @property {number} duration
   * @property {string} type
   */

  /**
   * @returns {Promise<BannedPhrase[]>}
   */
  getAllBannedPhrases() {
    return new Promise((accept, reject) => {
      this.db.all('select * from banned_words', (err, rows) => {
        if (err) {
          return reject(err);
        }
        if (rows.length > 0) {
          return accept(
            rows.map((row) => ({
              text: row.banned_text,
              duration: row.banned_duration,
              type: row.banned_type,
            })),
          );
        }
        return reject(new Error('No banned phrases found'));
      });
    });
  }

  /**
   * @param {string} bannedPhrase
   */
  deleteBannedPhrase(bannedPhrase) {
    return new Promise((accept, reject) => {
      const statement = this.db.prepare(`
      DELETE FROM banned_words 
      WHERE LOWER(banned_text) like ?`);
      statement.run(bannedPhrase, handleSimpleCallback(accept, reject));
    });
  }

  /**
   * @param {string} commandKey
   */
  addScheduledCommand(commandKey) {
    return new Promise((accept, reject) => {
      this.getCommandObject(commandKey)
        .then((command) =>
          this.doesScheduledCommandExist(command.cmd_id).then((doesExist) => {
            if (!doesExist) {
              return command;
            }
            return false;
          }),
        )
        .then((command) => {
          if (command === false) {
            return reject(new Error('Command not found or already scheduled'));
          }
          const statement = this.db.prepare(`
            INSERT INTO scheduled_commands 
            (sch_cmd_id)
            VALUES (?) `);
          return statement.run(command.cmd_id, handleSimpleCallback(accept, reject));
        });
    });
  }

  /**
   * @param {string} commandKey
   */
  deleteScheduledCommand(commandKey) {
    return new Promise((accept, reject) => {
      this.getCommandObject(commandKey).then((command) => {
        if (command === false) {
          return reject(new Error('Command not found'));
        }
        const statement = this.db.prepare(`
            DELETE FROM scheduled_commands
            WHERE sch_cmd_id = (?)`);
        return statement.run(command.cmd_id, handleSimpleCallback(accept, reject));
      });
    });
  }

  /**
   * @param {string} cmdId
   * @returns {Promise<boolean>}
   */
  doesScheduledCommandExist(cmdId) {
    return new Promise((accept, reject) => {
      const statement = this.db.prepare(`
      SELECT 1 FROM scheduled_commands 
      WHERE sch_cmd_id = ?`);
      statement.all(cmdId, (err, rows) => {
        if (err) {
          return reject(err);
        }
        if (rows.length === 1) {
          return accept(true);
        }
        return accept(false);
      });
    });
  }

  /**
   * @returns Promise<any[]>
   */
  getScheduledCommands() {
    return new Promise((accept, reject) => {
      this.db.all(
        `SELECT * FROM scheduled_commands 
        INNER JOIN commands ON scheduled_commands.sch_cmd_id = commands.cmd_id`,
        (err, rows) => {
          if (err) {
            return reject(err);
          }
          if (rows.length > 0) {
            return accept(rows);
          }
          return reject(new Error('No scheduled commands found'));
        },
      );
    });
  }
}

module.exports = Sql;
