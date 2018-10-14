const assert = require('assert');
const Sql = require('../../../lib/services/sql');
/*
db.init();
db.addCommand('!cool', 'bloop bloop').then(() => {
  logger.info('added the stuff');
}).catch((err) => {
  logger.error(err);
});

db.addCommand('!neat', 'bloop bloop').then(() => {
  logger.info('added the stuff');
}).catch((err) => {
  logger.error(err);
});

db.listCommands().then((thing) => {
  logger.info(thing);
}).catch();
*/
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
    const expected = '!test, !test2';
    this.sql.addCommand('!test', 'neat')
      .then(() => this.sql.addCommand('!test2', 'cool'))
      .then(() => this.sql.listCommands())
      .then((commands) => {
        assert.deepStrictEqual(expected, commands);
        done()
      }).catch(done);
  });


  it('gets static commands with no cron', function (done) {
    const expected = [{
      cmd_id: 1,
      cmd_key: '!test',
      cmd_message: 'neat',
      cmd_cron: null
    },
      {
        cmd_id: 2,
        cmd_key: '!test2',
        cmd_message: 'cool',
        cmd_cron: null
      }];
    this.sql.addCommand('!test', 'neat')
      .then(() => this.sql.addCommand('!test2', 'cool'))
      .then(() => this.sql.getStaticCommands())
      .then((commands) => {
        assert.deepStrictEqual(expected, commands)
        done();
      }).catch(done);
  });

  it('gets static commands with a cron', function (done) {
    const expected = [{
      cmd_id: 1,
      cmd_key: '!test',
      cmd_message: 'neat',
      cmd_cron: null
    },
      {
        cmd_id: 2,
        cmd_key: '!test2',
        cmd_message: 'cool',
        cmd_cron: null
      }];
    this.sql.addCommand('!test', 'neat')
      .then(() => this.sql.addCommand('!test2', 'cool'))
      .then(() => this.sql.getStaticCommands())
      .then((commands) => {
        assert.deepStrictEqual(expected, commands)
        done();
      }).catch(done);
  });
});
