

class CommandOutput {
  constructor(err, errMessage, output) {
    this.err = err;
    this.errMessage = errMessage;
    this.output = output;
  }
}

module.exports = CommandOutput;
