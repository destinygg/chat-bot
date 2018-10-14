

class Command {
  constructor(work, isPromiseOutput, privileges, inputValidator) {
    this.work = work;
    this.isPromiseOutput = isPromiseOutput;
    this.inputValidator = inputValidator;
    this.privileges = privileges;
  }
}

module.exports = Command;
