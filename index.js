/* eslint-disable no-process-exit */
const yargs = require('yargs/yargs');

const { argv } = yargs(process.argv.slice(2)).options({
  config: { type: 'string' },
  chat: { choices: ['twitch', 'dgg'] },
});

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
if (typeof argv.chat === 'string') {
  config.chatToConnectTo = argv.chat;
}

if (config === null) {
  // eslint-disable-next-line no-console
  console.log('WARNING: Config file not found, no config loaded. Shutting down.');
  process.exit(0);
}
const services = new Services(config, config.chatToConnectTo);
configureReporter(config.influx, new Map([['chat', config.chatToConnectTo]]));
const { logger } = services;

services
  .prepareAsyncServices()
  .then(() => {
    registerCommandsFromFiles(services.commandRegistry, config.chatToConnectTo, config);
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
    logger.info(`Configuring for ${config.chatToConnectTo} chat`);
    const commandRouter = new CommandRouter(services);
    const messageRouter = new MessageRouter({}, services);
    let bot = null;

    if (config.chatToConnectTo === 'twitch') {
      bot = new TwitchChat(config.twitch, services);
    } else if (config.chatToConnectTo === 'dgg') {
      bot = new DestinyChat(config.dggChat, services);
    } else {
      logger.error('Config property: "chatToConnectTo" not set to one of "dgg" or "twitch"');
      process.exit(1);
    }
    // Schedule some complex stuff
    services.fakeScheduler.createMessage('!youtube');
    services.fakeScheduler.createMessage('!schedule');

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
