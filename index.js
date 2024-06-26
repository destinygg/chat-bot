/* eslint-disable no-process-exit */
const { argv } = require('yargs');

const DestinyChat = require('./lib/services/destinychat');
const TwitchChat = require('./lib/services/twitch-chat');
const CommandRouter = require('./lib/message-routing/command-router');
const Services = require('./lib/services/service-index');
const loadConfig = require('./lib/configuration/config-loader');
const MessageRouter = require('./lib/message-routing/message-router');
const ChatServiceRouter = require('./lib/message-routing/chat-service-router');
const {
  registerCommandsFromFiles,
  setupCommandsAndCachesFromDb,
} = require('./lib/configuration/configure-commands');
const { configureReporter } = require('./lib/services/metrics/metrics-reporter');

const config = loadConfig(argv.config);
const chatToConnectTo = argv.chat || config.chatToConnectTo;
config.chatToConnectTo = chatToConnectTo;

if (config === null) {
  // eslint-disable-next-line no-console
  console.log('WARNING: Config file not found, no config loaded. Shutting down.');
  process.exit(0);
}
const services = new Services(config, chatToConnectTo);
configureReporter(config.influx, new Map([['chat', config.chatToConnectTo]]));
const { logger } = services;

services
  .prepareAsyncServices()
  .then(() => {
    registerCommandsFromFiles(services.commandRegistry, chatToConnectTo, config);
    logger.info('Config loaded! Starting bot!');
    return setupCommandsAndCachesFromDb(
      services.sql,
      services.commandRegistry,
      services.scheduledCommands,
      services.spamDetection,
      services.logger,
    ).catch((err) => {
      logger.warn(`Problem loading commands/banned phrases from sql. Reason: ${err}`);
    });
  })
  .then(() => {
    logger.info(`Configuring for ${chatToConnectTo} chat`);
    const commandRouter = new CommandRouter(services);
    const messageRouter = new MessageRouter({ chatConnectedTo: chatToConnectTo }, services);
    let bot = null;

    if (chatToConnectTo === 'twitch') {
      bot = new TwitchChat(config.twitch, services);
    } else if (chatToConnectTo === 'dgg') {
      bot = new DestinyChat(config.dggChat, services);
    } else {
      logger.error('Config property: "chatToConnectTo" not set to one of "dgg" or "twitch"');
      process.exit(1);
    }
    if(config.hasOwnProperty('scheduledCommands')){
      config.scheduledCommands.forEach(commandToSchedule => services.fakeScheduler.createMessage(commandToSchedule));
    }

    const chatServiceRouter = new ChatServiceRouter(
      config.chatToConnectTo,
      bot,
      messageRouter,
      commandRouter,
      logger,
      services.punishmentStream,
      services.scheduledCommands,
      services.fakeScheduler,
      services.messageRelay,
    );
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
