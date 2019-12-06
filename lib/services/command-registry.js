const Command = require('../commands/command-interface');

class CommandRegistry {
  constructor() {
    this.commands = {};
    this.aliases = {};
  }

  registerCommand(commandKey, commandWork, commandKeyAliases = []) {
    if (!(commandWork instanceof Command)) {
      throw new Error('Command must be an instance of the Command Interface');
    }
    this.commands[commandKey] = {
      work: commandWork,
      aliases: commandKeyAliases,
    };

    commandKeyAliases.forEach(commandKeyAlias => {
      this.aliases[commandKeyAlias] = commandKey;
    });
  }

  findCommand(commandKey) {
    const foundCommand = this.commands[commandKey];
    if (foundCommand) {
      return foundCommand.work;
    }
    const foundAlias = this.commands[this.aliases[commandKey]];
    if (foundAlias) {
      return foundAlias.work;
    }
    return false;
  }

  removeCommand(commandKey) {
    const aliasesToDelete = this.commands[commandKey].aliases;
    aliasesToDelete.forEach(alias => {
      delete this.aliases[alias];
    });
    delete this.commands[commandKey];
  }
}

module.exports = CommandRegistry;
