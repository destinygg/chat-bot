const _ = require('lodash');

class ChatServiceRouter {
  constructor(chatToConnectTo, bot, messageRouter, commandRouter, logger, punishmentStream) {
    this.messageRouter = messageRouter;
    this.commandRouter = commandRouter;
    this.chatToConnectTo = chatToConnectTo;
    this.logger = logger;
    this.bot = bot;
    this.punishmentStream = punishmentStream;
  }

  create() {
    this.bot.connect();
    this.bot.on('error', (error) => {
      this.logger.info('Chat Socket recieved error: ', error.message);
    });

    this.bot.on('closed', (event) => {
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

    this.bot.on('message', (newMesasge) => {
      this.messageRouter.routeIncomingMessages(newMesasge);
    });

    this.bot.on('command', (commandObject) => {
      this.commandRouter.routeIncomingCommandMessage(commandObject)
        .then((outputObject) => {
          if (_.isEmpty(outputObject.output)) {
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

    this.punishmentStream.on('data', (punishmentObject) => {
      if (punishmentObject.type === 'unmute') {
        this.bot.sendUnmute(punishmentObject);
        if (punishmentObject.reason) {
          this.bot.sendMessage(`${punishmentObject.reason}`);
        }

        return;
      }

      if (punishmentObject.type === 'mute') {
        this.bot.sendMute(punishmentObject);
      } else if (punishmentObject.type === 'ban') {
        this.bot.sendBan(punishmentObject.user, punishmentObject.duration);
      }

      if (!_.isEmpty(punishmentObject.reason) && this.chatToConnectTo === 'dgg') {
        this.bot.sendMessage(punishmentObject.reason);
      }
    });
  }
}

module.exports = ChatServiceRouter;
