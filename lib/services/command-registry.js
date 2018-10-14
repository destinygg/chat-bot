const Command = require('../commands/command-interface');

class CommandRegistry {
  constructor() {
    this.commands = {};
  }

  registerCommand(commandKey, commandWork) {
    if (!(commandWork instanceof Command)) {
      throw new Error('Command must be an instance of the Command Interface');
    }
    this.commands[commandKey] = commandWork;
  }

  findCommand(commandKey) {
    const foundCommand = this.commands[commandKey];
    if (foundCommand) {
      return foundCommand;
    }
    return false;
  }

  removeCommand(commandKey) {
    delete this.commands[commandKey];
  }
}

module.exports = CommandRegistry;
