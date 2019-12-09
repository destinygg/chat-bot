class Command {
  constructor(work, isPromiseOutput, privilegedCommand, inputValidator, multiLineCommand) {
    this.work = work;
    this.isPromiseOutput = isPromiseOutput;
    this.inputValidator = inputValidator;
    this.multiLineCommand = multiLineCommand;
    this.privilegedCommand = privilegedCommand;
  }
}

module.exports = Command;
