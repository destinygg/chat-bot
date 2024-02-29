const addCommand = require('../../../../lib/commands/implementations/addcommand');
const CommandOutput = require('../../../../lib/commands/command-output');
const assert = require('assert');
const sinon = require('sinon');
const Command = require('../../../../lib/commands/command-interface');

describe('AddCommand Tests', () => {
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
    const expected = new CommandOutput(null, `Added new command: ${newCommand}`);
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

  it('adds a command with arguments', function (done) {
    const registry = this.mockServices.commandRegistry;

    addCommand.work('!testargs testing {%1%} and {%2%} and {%1%}', this.mockServices).then((output) => {
      assert.deepStrictEqual(output, new CommandOutput(null, `Added new command: !testargs`));
      // No args
      assert.deepStrictEqual(
        registry.registerCommand.getCall(0).args[1].work(''),
        new CommandOutput(null, `testing  and  and `)
      );
      // Testing one argument
      assert.deepStrictEqual(
        registry.registerCommand.getCall(0).args[1].work('one'),
        new CommandOutput(null, `testing one and  and one`)
      );
      // Testing two arguments
      assert.deepStrictEqual(
        registry.registerCommand.getCall(0).args[1].work('one two'),
        new CommandOutput(null, `testing one and two and one`)
      );
      // Testing three arguments
      assert.deepStrictEqual(
        registry.registerCommand.getCall(0).args[1].work('one two three'),
        new CommandOutput(null, `testing one and two and one`)
      );
      done();
    }).catch(done);
  });

});

