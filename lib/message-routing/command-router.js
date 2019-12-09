const _ = require('lodash');
const { PRIVILEGED_USER_ROLES } = require('../chat-utils/privileged-user-list');
const { METRIC_NAMES } = require('../services/metrics/metric-names');
const { getReporter } = require('../services/metrics/metrics-reporter');

class CommandRouter {
  constructor(services) {
    this.commandRegister = services.commandRegistry;
    this.services = services;
    this.plebRateLimitSeconds = 1.5;
    this.roleCache = services.roleCache;
    this.isLimited = false;
    this.whisperLimited = false;
  }

  routeIncomingCommandMessage(commandObject) {
    if (commandObject.parsedCommand === false) {
      return Promise.resolve(false);
    }
    getReporter().incrementCounter(METRIC_NAMES.COMMANDS_RUN, 1);

    const { parsedCommand } = commandObject;
    const { parsedMessage } = commandObject;

    const commandFunction = this.commandRegister.findCommand(parsedCommand.commandString);
    if (
      _.isObject(commandFunction.inputValidator) &&
      !commandFunction.inputValidator.test(parsedCommand.input)
    ) {
      return Promise.resolve(false);
    }

    if (commandObject.isWhisper) {
      parsedMessage.roles = this.roleCache.getUsersRoles(parsedMessage.user);
      if (this.areWhispersLimited(parsedMessage.roles)) {
        return Promise.resolve(false);
      }
    }

    if (CommandRouter.checkPermission(commandFunction.privilegedCommand, parsedMessage.roles)) {
      return Promise.resolve(false);
    }

    if (commandObject.isWhisper === false && this.arePlebsRateLimited(parsedMessage.roles)) {
      return Promise.resolve(false);
    }

    if (commandFunction !== false) {
      return this.runCommand(
        commandFunction,
        parsedCommand.input,
        parsedMessage,
        commandObject.isWhisper,
      );
    }
    return Promise.resolve(false);
  }

  static checkPermission(privilegedCommand, roles) {
    if (privilegedCommand === true) {
      return !_.some(roles, role => PRIVILEGED_USER_ROLES[role]);
    }
    return false;
  }

  areWhispersLimited(roles) {
    if (_.some(roles, role => PRIVILEGED_USER_ROLES[role])) {
      return false;
    }

    if (this.whisperLimited === true) {
      return true;
    }
    setTimeout(() => {
      this.whisperLimited = false;
    }, this.plebRateLimitSeconds * 250);
    this.whisperLimited = true;
    return false;
  }

  arePlebsRateLimited(roles) {
    if (_.some(roles, role => PRIVILEGED_USER_ROLES[role])) {
      return false;
    }

    if (this.isLimited === true) {
      return true;
    }
    setTimeout(() => {
      this.isLimited = false;
    }, this.plebRateLimitSeconds * 1000);
    this.isLimited = true;
    return false;
  }

  runCommand(command, input, parsedMessage, isWhisper) {
    return new Promise((accept, reject) => {
      if (command.isPromiseOutput) {
        return command
          .work(input, this.services, parsedMessage)
          .then(outputObject => {
            if (outputObject.err !== null) {
              return accept({ err: outputObject.err, output: outputObject.output });
            }
            return accept({
              user: parsedMessage.user,
              isWhisper,
              output: outputObject.output,
              isMultiLine: command.multiLineCommand,
            });
          })
          .catch(err => {
            if (err) {
              return reject(err);
            }
            return reject(new Error('Something bad happened?? Check the logs.'));
          });
      }

      try {
        const staticOutputObject = command.work(input, this.services, parsedMessage);
        return accept({
          user: parsedMessage.user,
          output: staticOutputObject.output,
          isMultiLine: command.multiLineCommand,
          isWhisper,
        });
      } catch (e) {
        this.services.logger.error(e);
        return reject(new Error('Something bad happened??'));
      }
    });
  }
}

module.exports = CommandRouter;
