class ChatServiceRouter {
  constructor(chatToConnectTo, bot, messageRouter, commandRouter, logger) {
    this.messageRouter = messageRouter;
    this.commandRouter = commandRouter;
    this.chatToConnectTo = chatToConnectTo;
    this.logger = logger;
    this.bot = bot;
  }

  create() {
    this.bot.connect();
    this.bot.on('error', (error) => {
      this.logger.info('Chat Socket recieved error: ', error.message);
    });

    this.bot.on('closed', (event) => {
      this.logger.info('Chat socket closed. Attempting to reconnect in 5....');
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
      this.messageRouter.routeIncomingMessages(newMesasge).then((punishment) => {
        this.logger.debug(punishment);
      });
    });

    this.bot.on('command', (commandObject) => {
      console.log(commandObject);
      this.commandRouter.routeIncomingCommandMessage(commandObject)
        .then((output) => {
          if (output) {
            return this.bot.sendMessage(output);
          }
          return false;
        }).catch((err) => {
          this.logger.error('Got an error while parsing command: ', err);
        });
    });
  }
}

module.exports = ChatServiceRouter;
