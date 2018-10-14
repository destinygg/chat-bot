const assert = require('assert');
const CommandRegistry = require('../../../lib/services/command-registry');
const Command = require('../../../lib/commands/command-interface');

describe('Command Registry Tests', () => {
  it('registers commands that adhere to the command interface', function () {
    const registry = new CommandRegistry();
    const command = new Command(()=>{}, false, null, null);
    registry.registerCommand('!test', command);
    assert.deepStrictEqual(registry.commands['!test'], command)
  });

  it('throws an error if a non command is registered', function () {
    const registry = new CommandRegistry();
    try {
      registry.registerCommand('!test', {blooper:'booopery'});
      assert(false);
    }
    catch (e){
      assert.deepStrictEqual(e, new Error('Command must be an instance of the Command Interface'));
    }
  });

  it('returns the command if a command exists', function () {
    const registry = new CommandRegistry();
    const command = new Command(()=>{}, false, null, null);
    registry.registerCommand('!test', command);
    const result = registry.findCommand('!test');
    assert.deepStrictEqual(result, command)
  });

  it('returns false if a command does not exist', function () {
    const registry = new CommandRegistry();
    const command = new Command(()=>{}, false, null, null);
    registry.registerCommand('!test', command);
    const result = registry.findCommand('!megamilk');
    assert.deepStrictEqual(result, false)
  });

  it('removes a command', function () {
    const registry = new CommandRegistry();
    const command = new Command(()=>{}, false, null, null);
    registry.registerCommand('!test', command);
    registry.removeCommand('!test');
    assert.deepStrictEqual(registry.commands['!test'], undefined)
  });
});
