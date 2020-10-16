class CommandOutput {
  /**
   * @param {Error} err
   * @param {string | string[]} output
   */
  constructor(err, output) {
    this.err = err;
    this.output = output;
  }
}

module.exports = CommandOutput;
