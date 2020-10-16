class Command {
  /**
   * @param {function} work
   * @param {boolean} isPromiseOutput
   * @param {boolean} [privilegedCommand]
   * @param {RegExp} [inputValidator]
   * @param {boolean} [multiLineCommand]
   */
  constructor(work, isPromiseOutput, privilegedCommand, inputValidator, multiLineCommand) {
    this.work = work;
    this.isPromiseOutput = isPromiseOutput;
    this.inputValidator = inputValidator;
    this.multiLineCommand = multiLineCommand;
    this.privilegedCommand = privilegedCommand;
  }
}

module.exports = Command;
