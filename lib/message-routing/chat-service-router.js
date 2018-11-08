const _ = require('lodash');

class ChatServiceRouter {
  constructor(chatToConnectTo, bot, messageRouter, commandRouter, logger,
    punishmentStream, messageSchedulerStream) {
    this.messageRouter = messageRouter;
    this.commandRouter = commandRouter;
    this.chatToConnectTo = chatToConnectTo;
    this.logger = logger;
    this.bot = bot;
    this.punishmentStream = punishmentStream;
    this.messageSchedulerStream = messageSchedulerStream;
  }

  create() {
    this.bot.connect();
    this.bot.on('error', (error) => {
      this.logger.info('Chat Socket recieved error: ', error.message);
    });

    this.bot.on('closed', () => {
      this.logger.info('Chat socket closed. Attempting to reconnect....');
      if (this.chatToConnectTo === 'dgg') {
        setTimeout(() => {
          this.bot.connect();
        }, 5000);
      }
    });

    this.bot.on('open', () => {
      this.logger.info('Chat socket opened.');
    });

    this.bot.on('message', (newMessage) => {
      this.messageRouter.routeIncomingMessages(newMessage);
    });

    this.bot.on('command', (commandObject) => {
      this.commandRouter.routeIncomingCommandMessage(commandObject)
        .then((outputObject) => {
          if (_.isEmpty(outputObject.output)) {
            return;
          }

          if (outputObject.err) {
            this.logger.error('Purposeful error thrown by command', commandObject, outputObject.err);
            if (_.isString(outputObject.output)) {
              this.bot.sendMessage(outputObject.output);
            }
            return;
          }

          if (this.chatToConnectTo === 'dgg' && outputObject.isMultiLine) {
            this.bot.sendMultiLine(outputObject.output);
          } else if (this.chatToConnectTo === 'twitch' && outputObject.isMultiLine) {
            // There's no good way to do multilines in twitch atm? :C
            this.bot.sendMessage(outputObject.output.join(' '));
          } else {
            this.bot.sendMessage(outputObject.output);
          }
        }).catch((err) => {
          this.logger.error('Got an error while parsing command: ', err);
        });
    });

    this.messageSchedulerStream.on('command', (commandObject) => {
      this.bot.sendMessage(commandObject.work().output);
    });

    this.punishmentStream.on('data', (punishmentObject) => {
      switch (punishmentObject.type) {
        case 'unmute':
          this.bot.sendUnmute(punishmentObject);
          break;
        case 'mute':
          this.bot.sendMute(punishmentObject);
          break;
        case 'ban':
          this.bot.sendBan(punishmentObject);
          break;
        case 'unban':
          this.bot.sendUnban(punishmentObject);
          break;
        default:
          return;
      }

      if (!_.isEmpty(punishmentObject.reason) && this.chatToConnectTo === 'dgg') {
        this.bot.sendMessage(punishmentObject.reason);
      }
    });
  }
}

module.exports = ChatServiceRouter;
