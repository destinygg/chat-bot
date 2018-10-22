const OverRustleLogs = require('./over-rustle-logs');
const logger = require('./logger');
const Sql = require('./sql');
const ChatCache = require('./dgg-rolling-chat-cache');
const CommandRegistry = require('./command-registry');
const PunishmentCache = require('./punishment-cache');
const PunishmentStream = require('./punishment-read-write-stream');
const SpamDetection = require('./spam-detection');
const ScheduledCommands = require('./message-scheduler');
const LastFm = require('./lastfm');
const YouTube = require('./youtube.js');
const TwitchApi = require('./twitch-api');

class Services {
  constructor(serviceConfigurations) {
    this.overRustle = new OverRustleLogs(serviceConfigurations.overRustle);
    this.logger = logger(serviceConfigurations.logger);
    this.sql = new Sql(serviceConfigurations.sql);
    this.commandRegistry = new CommandRegistry();
    this.chatCache = new ChatCache(serviceConfigurations.chatCache);
    this.punishmentCache = new PunishmentCache(serviceConfigurations.punishmentCache);
    this.punishmentStream = new PunishmentStream(this);
    this.spamDetection = new SpamDetection(serviceConfigurations.spamDetection);
    this.scheduledCommands = new ScheduledCommands(serviceConfigurations.schedule);
    this.lastfm = new LastFm(serviceConfigurations.lastFm);
    this.youtube = new YouTube(serviceConfigurations.youtube);
    this.twitch = new TwitchApi(serviceConfigurations.twitch);
  }

  prepareAsyncServices() {
    return this.sql
      .createConnection()
      .then(() => {
        this.sql.init();
        this.scheduledCommands.startScheduledMessages();
      });
  }
}

module.exports = Services;
