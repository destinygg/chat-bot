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
      this.db.run(`CREATE TABLE IF NOT EXISTS commands (
      cmd_id       INTEGER PRIMARY KEY,
      cmd_key      TEXT,
      cmd_message  TEXT NOT NULL,
      cmd_cron TEXT,
      UNIQUE(cmd_key));`, handleSimpleCallback(accept, reject));
    });
  }

  addCommand(commandString, output, cron = null) {
    return new Promise((accept, reject) => {
      const statement = this.db.prepare(`
      INSERT INTO commands 
      (cmd_key, cmd_message, cmd_cron) 
      VALUES (?, ?, ?)`);

      statement.run(commandString, output, cron,
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

  getStaticCommands() {
    return new Promise((accept, reject) => {
      this.db.all('SELECT * FROM commands WHERE cmd_cron IS null', (err, rows) => {
        if (err) {
          return reject(err);
        }
        if (rows.length > 0) {
          return accept(rows);
        }
        return reject(new Error('No cron commands found.'));
      });
    });
  }

  getCronCommands() {
    return new Promise((accept, reject) => {
      this.db.all('SELECT * FROM commands WHERE cmd_cron IS NOT null', (err, rows) => {
        if (err) {
          return reject(err);
        }
        if (rows.length > 0) {
          return accept(rows);
        }
      });
    });
  }
}

module.exports = Sql;
