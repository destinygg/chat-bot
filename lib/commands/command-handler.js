class CommandHandler {
  constructor(services) {
    this.commandRegister = services.commandRegistry;
    this.services = services;
  }

  handleIncomingCommandMessage(commandObject) {
    if (commandObject.parsedCommand === false) {
      return Promise.resolve(false);
    }
    const { parsedCommand } = commandObject;
    const message = commandObject.parsedMessage;
    const commandFunction = this.commandRegister.findCommand(parsedCommand.commandString);
    if (commandFunction !== false) {
      return this.runCommand(commandFunction, parsedCommand.input);
    }
    return Promise.resolve(false);
  }

  validateInput(command, input) {
    return command.validateInput(command, input);
  }

  runCommand(command, input) {
    return new Promise((accept, reject) => {
      if (command.isPromiseOutput) {
        return command.work(input, this.services).then((outputObject) => {
          if (outputObject.err !== null) {
            return reject(outputObject.errMessage);
          }
          return accept(outputObject.output);
        }).catch((err) => {
          if (err) {
            return reject(err);
          }
          return reject(new Error('Something bad happened?? Check the logs.'));
        });
      }

      try {
        return accept(command.work(input, this.services).output);
      } catch (e) {
        this.services.logger.error(e);
        return reject(new Error('Something bad happened??'));
      }
    });
  }
}

module.exports = CommandHandler;
