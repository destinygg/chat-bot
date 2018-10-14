const addCommand = require('../../../../lib/commands/implementations/addcommand');
const CommandOutput = require('../../../../lib/commands/command-output');
const assert = require('assert');
const sinon = require('sinon');
const Command = require('../../../../lib/commands/command-interface');

describe('AddCommand Test', () => {
  beforeEach(function () {
    this.mockServices = {
      sql: {
        addCommand: sinon.spy(function (input, text) {
          return Promise.resolve();
        })
      },
      commandRegistry: {
        registerCommand: sinon.spy(function (newCommand, commandObject) {
        }),
        findCommand: sinon.spy(function (commandString) {
        })
      }
    }
  });

  it('adds a command and invokes service calls properly', function (done) {
    const newCommand = '!test';
    const sql = this.mockServices.sql;
    const registry = this.mockServices.commandRegistry;
    const expected = new CommandOutput(null, null, `Added new command: ${newCommand}`);
    addCommand.work('!test cool test text', this.mockServices).then((output) => {
      assert.deepStrictEqual(output, expected);
      assert.deepStrictEqual(sql.addCommand.getCall(0).args[0], '!test');
      assert.deepStrictEqual(sql.addCommand.getCall(0).args[1], 'cool test text');
      assert.deepStrictEqual(registry.findCommand.getCall(0).args[0], '!test');
      assert.deepStrictEqual(registry.registerCommand.getCall(0).args[0], '!test');
      assert(registry.registerCommand.getCall(0).args[1] instanceof Command);
      done();
    }).catch(done);
  });

});

