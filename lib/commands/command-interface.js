/**
 * @callback CommandCallback
 * @param {string} input
 * @param {import("../services/service-index")} services
 * @param {import("../chat-utils/parse-commands-from-chat").ParsedMessage} parsedMessage
 * @returns {import("./command-output")|Promise<import("./command-output")>}
 */

class Command {
  /**
   * @param {CommandCallback} work
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
