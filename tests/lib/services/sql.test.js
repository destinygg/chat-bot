const assert = require('assert');
const Sql = require('../../../lib/services/sql');

describe('SQLite Tests', () => {
  const config = {fileLocation: ':memory:'};
  beforeEach(function (done) {
    this.sql = new Sql(config);
    this.sql.createConnection().then(()=>this.sql.init()).then(done);
  });

  it('creates a table successfully', function (done) {
    const db = new Sql(config);
    this.sql.createConnection().then(()=>this.sql.init()).then(done);
  });

  it('creates and adds a command without cron to the table and lists it', function (done) {
    const expected = '!test';
    this.sql.addCommand('!test', 'neat')
      .then(() => this.sql.listCommands())
      .then((commands) => {
        assert.deepStrictEqual(expected, commands);
        done()
      }).catch(done);
  });

  it('creates and deletes a command', function (done) {
    const expected = null;
    this.sql.addCommand('!test', 'neat')
      .then(() => this.sql.deleteCommand('!test'))
      .then(() => this.sql.listCommands())
      .then((commands) => {
        done(new Error(`Commands was not empty: ${commands}`))
      }).catch(err => {
        assert.deepStrictEqual(err.message, 'No commands');
        done()
    });
  });

  it('throws if command does not exist', function (done) {
    const expected = null;
    this.sql.addCommand('!test', 'neat')
      .then(() => this.sql.deleteCommand('!pls'))
      .then(() => {
        done()
      }).catch(err => {
      assert.deepStrictEqual(err.message, 'Command does not exist');
      done()
    });
  });


  it('it lists many commands after being added the table', function (done) {
    const expected = '!test,!test2';
    this.sql.addCommand('!test', 'neat')
      .then(() => this.sql.addCommand('!test2', 'cool'))
      .then(() => this.sql.listCommands())
      .then((commands) => {
        assert.deepStrictEqual(expected, commands);
        done()
      }).catch(done);
  });


  it('gets static commands', function (done) {
    const expected = [{
      cmd_id: 1,
      cmd_key: '!test',
      cmd_message: 'neat'
    },
      {
        cmd_id: 2,
        cmd_key: '!test2',
        cmd_message: 'cool'
      }];
    this.sql.addCommand('!test', 'neat')
      .then(() => this.sql.addCommand('!test2', 'cool'))
      .then(() => this.sql.getCommands())
      .then((commands) => {
        assert.deepStrictEqual(expected, commands);
        done();
      }).catch(done);
  });

  it('adds scheduled and gets commands', function (done) {
    const expected = [ { sch_id: 1,
      sch_cmd_id: 1,
      cmd_id: 1,
      cmd_key: '!test',
      cmd_message: 'neat' } ];
    this.sql.addCommand('!test', 'neat')
      .then(() => this.sql.addScheduledCommand('!test'))
      .then(() => this.sql.getScheduledCommands())
      .then((commands) => {
        assert.deepStrictEqual(expected, commands);
        done();
      }).catch(done);
  });

  it('does not add the same command twice', function (done) {
    const expected = [ { sch_id: 1,
      sch_cmd_id: 1,
      cmd_id: 1,
      cmd_key: '!test',
      cmd_message: 'neat' } ];
    this.sql.addCommand('!test', 'neat')
      .then(() => this.sql.addScheduledCommand('!test'))
      .then(() => this.sql.addScheduledCommand('!test'))
      .then(() => this.sql.getScheduledCommands())
      .then((commands) => {
        done(new Error('added the same command twice :C'));
      }).catch(err => {
        assert.deepStrictEqual('Command not found or already scheduled', err.message)
        done();
    });
  });


  it('adds scheduled commands and gets them all', function (done) {
    const expected = [ { sch_id: 1,
      sch_cmd_id: 1,
      cmd_id: 1,
      cmd_key: '!test',
      cmd_message: 'neat' },
      { sch_id: 2,
        sch_cmd_id: 2,
        cmd_id: 2,
        cmd_key: '!test2',
        cmd_message: 'cool' } ];
    this.sql.addCommand('!test', 'neat')
      .then(() => this.sql.addScheduledCommand('!test'))
      .then(() => this.sql.addCommand('!test2', 'cool'))
      .then(() => this.sql.addScheduledCommand('!test2'))
      .then(() => this.sql.getScheduledCommands())
      .then((commands) => {
        assert.deepStrictEqual(expected, commands);
        done();
      }).catch(done);
  });

  it('removes a scheduled commands if the parent command is removed', function (done) {
    const expected = [];
    this.sql.addCommand('!test', 'neat')
      .then(() => this.sql.addScheduledCommand('!test'))
      .then(() => this.sql.deleteCommand('!test'))
      .then(() => this.sql.getScheduledCommands())
      .then((commands) => {
        done(new Error('Command not deleted'))
      }).catch(err => {
        assert.deepStrictEqual(err.message, 'No scheduled commands found');
        done();
    });
  });


  it('adds a banned phrase and gets it', function (done) {
    const expected = [{ text: 'cool beans', duration: 600, type: 'mute' }];
    this.sql.addBannedPhrase('cool beans', 600, 'mute')
      .then(() => this.sql.getAllBannedPhrases('!test'))
      .then((commands) => {
        assert.deepStrictEqual(commands, expected);
        done();
      }).catch(done);
  });

  it('cant add the same banned phrase twice', function (done) {
    const expected = [{ text: 'cool beans', duration: 600, type: 'mute' }];
    this.sql.addBannedPhrase('cool beans', 600, 'mute')
      .then(() => this.sql.addBannedPhrase('cool beans', 600, 'mute'))
      .then(() => this.sql.getAllBannedPhrases())
      .then((commands) => {
        done(new Error('Same phrased added twice :C'));
      }).catch(err => {
        assert.deepStrictEqual(err.errno, 19);
        done()
    });
  });

  it('deletes banned phrases', function (done) {
    const expected = [{ text: 'cool beans', duration: 600, type: 'mute' }];
    this.sql.addBannedPhrase('cool beans', 600, 'mute')
      .then(() => this.sql.deleteBannedPhrase('cool beans'))
      .then(() => this.sql.getAllBannedPhrases())
      .then((phrases) => {
        done(new Error('Did not delete banned phrases'));
      }).catch(err => {
      assert.deepStrictEqual(err.message, 'No banned phrases found');
      done()
    });
  });

  it('gets all banned phrases', function (done) {
    const expected = [ { text: 'cool beans', duration: 1000, type: 'ban' },
      { text: 'meepo meepo meep', duration: 1500, type: 'mute' } ];
    this.sql.addBannedPhrase('cool beans', 1000, 'ban')
      .then(() => this.sql.addBannedPhrase('meepo meepo meep', 1500, 'mute'))
      .then(() => this.sql.getAllBannedPhrases())
      .then((phrases) => {
        assert.deepStrictEqual(phrases, expected);
        done()
      }).catch(done);
  });

  it('returns proper error if no banned phrases present', function (done) {
    const expected = [];
    this.sql.getAllBannedPhrases()
      .then(() => {
        done(new Error('didnt give proper error'))
      }).catch(err => {
      assert.deepStrictEqual(err.message, 'No banned phrases found');
      done();
    });
  });

  it('updates duo phrase', function (done) {
    const expected = [];
    this.sql.updateDuo('Jimmy')
      .then(() => {
        this.sql.getDuoText().then(duoText => {
          assert.deepStrictEqual(duoText, 'Jimmy');
          done();
        })
      }).catch(err => {
      done(err);
    });
  });

  it('increments death', function (done) {
    const expected = [];
    this.sql.incrementDeaths()
      .then(() => {
        return this.sql.getDeaths().then(deaths => {
          assert.deepStrictEqual(deaths, 1);
          done();
        })
      }).catch(err => {
      done(err);
    });
  });

  it.skip('increments death again', function (done) {
    const expected = [];
    this.timeout(3000)
    this.sql.incrementDeaths(2)
      .then(() => {
        setTimeout(()=>{
          this.sql.incrementDeaths(2).then(() => {
            this.sql.getDeaths().then(deaths => {
              assert.deepStrictEqual(deaths, 2);
              done();
            });
          });
        }, 2222);
      }).catch(err => {
      done(err);
    });
    this.sql.getDeaths()
  });

  it.skip('increments death but only if the update length of seconds has passed', function (done) {
    const expected = [];
    this.timeout(3000)
    this.sql.incrementDeaths(2)
      .then(() => {
        setTimeout(()=>{
          this.sql.incrementDeaths(3).then(() => {
            this.sql.getDeaths().then(deaths => {
              assert.deepStrictEqual(deaths, 1);
              done();
            });
          });
        }, 2222);
      }).catch(err => {
      done(err);
    });
    this.sql.getDeaths()
  });


  it('sets deaths', function (done) {
    const expected = [];
    this.sql.setDeaths(50)
      .then(() => {
        return this.sql.getDeaths().then(deaths => {
          assert.deepStrictEqual(deaths, 50);
          done();
        })
      }).catch(err => {
      done(err);
    });
  });

});
