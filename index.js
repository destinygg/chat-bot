const DestinyChat = require('./lib/services/destinychat');
const TwitchChat = require('./lib/services/twitch-chat');
const CommandRouter = require('./lib/message-routing/command-router');
const Services = require('./lib/services/service-index');
const loadConfig = require('./lib/configuration/config-loader');
const MessageRouter = require('./lib/message-routing/message-router');
const ChatServiceRouter = require('./lib/message-routing/chat-service-router');
const { registerCommandsFromFiles, registerCommandsFromDatabase } = require('./lib/configuration/configure-commands');


const config = loadConfig();
const services = new Services(config);
const { logger } = services;

services.prepareAsyncServices()
  .then(() => {
    registerCommandsFromFiles(services.commandRegistry);
    logger.info('Config loaded! Starting bot!');
    return registerCommandsFromDatabase(services.sql, services.commandRegistry,
      services.scheduledCommands, services.logger)
      .catch((err) => {
        logger.warn(`No stored commands loaded. Reason: ${err}`);
      });
  })
  .then(() => {
    const { chatToConnectTo } = config;
    logger.info(`Configuring for ${chatToConnectTo} chat`);
    const commandRouter = new CommandRouter(services);
    const messageRouter = new MessageRouter({}, services);
    let bot = null;

    if (chatToConnectTo === 'twitch') {
      bot = new TwitchChat(config.twitch, services);
    } else if (chatToConnectTo === 'dgg') {
      bot = new DestinyChat(config.dggChat, services);
    } else {
      logger.error('Config property: "chatToConnectTo" not set to one of "dgg" or "twitch"');
      process.exit(1);
    }

    const chatServiceRouter = new ChatServiceRouter(config.chatToConnectTo, bot,
      messageRouter, commandRouter, logger, services.punishmentStream, services.scheduledCommands);
    chatServiceRouter.create();
  })
  .catch((err) => {
    logger.error('Problem starting up services, shutting down...');
    logger.error(err);
    process.exit(1);
  });


process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception. Crashing.');
  logger.error(err);
  process.exit(1);
});
