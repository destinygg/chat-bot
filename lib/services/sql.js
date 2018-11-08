const Sqlite = require('sqlite3');

function handleSimpleCallback(a, r) {
  return err => (err ? r(err) : a());
}

class Sql {
  constructor(config) {
    this.config = config;
    this.db = null;
  }

  createConnection() {
    return new Promise((accept, reject) => {
      this.db = new Sqlite.Database(this.config.fileLocation || `${__dirname}/../../storage.db`,
        (err) => {
          if (err) {
            return reject(err);
          }
          return accept(this);
        });
    });
  }

  init() {
    return new Promise((accept, reject) => {
      this.db.exec(`CREATE TABLE IF NOT EXISTS commands (
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
      
      CREATE TABLE IF NOT EXISTS scheduled_commands (
      sch_id       INTEGER PRIMARY KEY,
      sch_cmd_id   INTEGER REFERENCES commands (cmd_id) ON DELETE CASCADE);
      `, handleSimpleCallback(accept, reject));
    });
  }

  addCommand(commandString, output) {
    return new Promise((accept, reject) => {
      const statement = this.db.prepare(`
      INSERT INTO commands 
      (cmd_key, cmd_message) 
      VALUES (?, ?)`);

      statement.run(commandString, output,
        handleSimpleCallback(accept, reject));
    });
  }

  deleteCommand(commandString) {
    return this.doesCommandExist(commandString)
      .then((doesExist) => {
        if (doesExist) {
          return this.internalDeleteCommand(commandString);
        }
        return Promise.reject(new Error('Command does not exist'));
      });
  }


  internalDeleteCommand(commandString) {
    return new Promise((accept, reject) => {
      const statement = this.db.prepare(`
            DELETE FROM commands 
            WHERE cmd_key = ?`);
      return statement.run(commandString,
        handleSimpleCallback(accept, reject));
    });
  }

  doesCommandExist(commandString) {
    return new Promise((accept, reject) => {
      const statement = this.db.prepare(`
      SELECT * FROM commands 
      WHERE cmd_key = ?`);
      statement.all(commandString,
        (err, rows) => {
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

  getCommandObject(commandString) {
    return new Promise((accept, reject) => {
      const statement = this.db.prepare(`
      SELECT * FROM commands 
      WHERE cmd_key = ?`);
      statement.all(commandString,
        (err, rows) => {
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

  listCommands() {
    return new Promise((accept, reject) => {
      this.db.all('select * from commands', (err, rows) => {
        if (err) {
          return reject(err);
        }
        if (rows.length > 0) {
          return accept(rows.map(row => row.cmd_key).join(', ').trim());
        }
        return reject(new Error('No commands'));
      });
    });
  }

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

  addBannedPhrase(bannedPhrase, duration, type) {
    return new Promise((accept, reject) => {
      const statement = this.db.prepare(`
      INSERT INTO banned_words 
      (banned_text, banned_duration, banned_type) 
      VALUES (?, ?, ?)`);

      statement.run(bannedPhrase, duration, type,
        handleSimpleCallback(accept, reject));
    });
  }

  getAllBannedPhrases() {
    return new Promise((accept, reject) => {
      this.db.all('select * from banned_words', (err, rows) => {
        if (err) {
          return reject(err);
        }
        if (rows.length > 0) {
          return accept(rows.map(row => ({
            text: row.banned_text,
            duration: row.banned_duration,
            type: row.banned_type,
          })));
        }
        return reject(new Error('No banned phrases found'));
      });
    });
  }

  deleteBannedPhrase(bannedPhrase) {
    return new Promise((accept, reject) => {
      const statement = this.db.prepare(`
      DELETE FROM banned_words 
      WHERE banned_text = ?`);
      statement.run(bannedPhrase,
        handleSimpleCallback(accept, reject));
    });
  }

  addScheduledCommand(commandKey) {
    return new Promise((accept, reject) => {
      this.getCommandObject(commandKey)
        .then(command => this.doesScheduledCommandExist(command.cmd_id).then((doesExist) => {
          if (!doesExist) {
            return command;
          }
          return false;
        }))
        .then((command) => {
          if (command === false) {
            return reject(new Error('Command not found or already scheduled'));
          }
          const statement = this.db.prepare(`
            INSERT INTO scheduled_commands 
            (sch_cmd_id)
            VALUES (?) `);
          return statement.run(command.cmd_id,
            handleSimpleCallback(accept, reject));
        });
    });
  }

  deleteScheduledCommand(commandKey) {
    return new Promise((accept, reject) => {
      this.getCommandObject(commandKey)
        .then((command) => {
          if (command === false) {
            return reject(new Error('Command not found'));
          }
          const statement = this.db.prepare(`
            DELETE FROM scheduled_commands
            WHERE sch_cmd_id = (?)`);
          return statement.run(command.cmd_id,
            handleSimpleCallback(accept, reject));
        });
    });
  }

  doesScheduledCommandExist(cmdId) {
    return new Promise((accept, reject) => {
      const statement = this.db.prepare(`
      SELECT 1 FROM scheduled_commands 
      WHERE sch_cmd_id = ?`);
      statement.all(cmdId,
        (err, rows) => {
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

  getScheduledCommands() {
    return new Promise((accept, reject) => {
      this.db.all(`SELECT * FROM scheduled_commands 
        INNER JOIN commands ON scheduled_commands.sch_cmd_id = commands.cmd_id`, (err, rows) => {
        if (err) {
          return reject(err);
        }
        if (rows.length > 0) {
          return accept(rows);
        }
        return reject(new Error('No scheduled commands found'));
      });
    });
  }
}

module.exports = Sql;
