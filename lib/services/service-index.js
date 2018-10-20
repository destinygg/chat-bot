const OverRustleLogs = require('./over-rustle-logs');
const logger = require('./logger');
const Sql = require('./sql');
const ChatCache = require('./dgg-rolling-chat-cache');
const CommandRegistry = require('./command-registry');
const PunishmentCache = require('./punishment-cache');
const PunishmentStream = require('./punishment-read-write-stream');
const SpamDetection = require('./spam-detection');
const LastFm = require('./lastfm');

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
    this.lastfm = new LastFm(serviceConfigurations.lastFm);
  }

  prepareAsyncServices() {
    return this.sql
      .createConnection()
      .then(() => this.sql.init());
  }
}

module.exports = Services;
