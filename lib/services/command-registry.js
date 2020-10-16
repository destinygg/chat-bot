const Command = require('../commands/command-interface');

/**
 * @typedef Command
 * @type {Object}
 * @property {import("../commands/command-interface")} work
 * @property {string[]} aliases
 */

class CommandRegistry {
  constructor() {
    /**
     * @type {Object<string, Command>}
     */
    this.commands = {};
    /**
     * @type {Object<string, string>}
     */
    this.aliases = {};
  }

  /**
   * @param {string} commandKey
   * @param {import("../commands/command-interface")} commandWork
   * @param {string[]} commandKeyAliases
   */
  registerCommand(commandKey, commandWork, commandKeyAliases = []) {
    if (!(commandWork instanceof Command)) {
      throw new Error('Command must be an instance of the Command Interface');
    }
    this.commands[commandKey] = {
      work: commandWork,
      aliases: commandKeyAliases,
    };

    commandKeyAliases.forEach((commandKeyAlias) => {
      this.aliases[commandKeyAlias] = commandKey;
    });
  }

  /**
   * @param {string} commandKey
   */
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

  /**
   * @param {string} commandKey
   */
  removeCommand(commandKey) {
    const aliasesToDelete = this.commands[commandKey].aliases;
    aliasesToDelete.forEach((alias) => {
      delete this.aliases[alias];
    });
    delete this.commands[commandKey];
  }
}

module.exports = CommandRegistry;
