const DestinyChat = require('./lib/services/destinychat');
const CommandHandler = require('./lib/commands/command-handler');
const Services = require('./lib/services/service-index');
const loadConfig = require('./lib/configuration/config-loader');
const MessageHandler = require('./lib/messages/message-handler');
const { registerCommandsFromFiles, registerCommandsFromDatabase } = require('./lib/configuration/configure-commands');


const config = loadConfig();
const services = new Services(config);
const { logger } = services;

// TODO Create a routing file that routes messages from the emitter to various components.
services.prepareAsyncServices()
  .then(() => {
    registerCommandsFromFiles(services.commandRegistry);
    logger.info('Config loaded! Starting bot!');
    return registerCommandsFromDatabase(services.sql, services.commandRegistry).catch((err) => {
      logger.warn(`No stored commands loaded. Reason: ${err}`);
    });
  })
  .then(() => {
    const commandHandler = new CommandHandler(services);
    const messageHandler = new MessageHandler({}, services);
    const destinyBot = new DestinyChat(config.dggChat, services);
    destinyBot.connect();
    destinyBot.on('error', (error) => {
      logger.info('Chat Socket recieved error: ', error.message);
    });

    destinyBot.on('closed', (event) => {
      logger.info('Chat socket closed. Attempting to reconnect in 5....');
      setTimeout(() => {
        destinyBot.connect();
      }, 5000);
    });

    destinyBot.on('open', (event) => {
      logger.info('Chat socket opened.');
    });

    destinyBot.on('message', (newMesasge) => {
      messageHandler.handleIncomingMessage(newMesasge).then((punishment) => {
        logger.debug(punishment);
      });
    });

    destinyBot.on('command', (commandObject) => {
      commandHandler.handleIncomingCommandMessage(commandObject)
        .then((output) => {
          if (output) {
            return destinyBot.sendMessage(output);
          }
          return false;
        }).catch((err) => {
          logger.error('Got an error while parsing command: ', err);
        });
    });
  })
  .catch((err) => {
    logger.error('Problem starting up services, shutting down...');
    logger.error(err);
    process.exit(1);
  });
