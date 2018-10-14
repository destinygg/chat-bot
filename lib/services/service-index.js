const OverRustleLogs = require('./over-rustle-logs');
const logger = require('./logger');
const Sql = require('./sql');
const ChatCache = require('./dgg-rolling-chat-cache');
const CommandRegistry = require('./command-registry');

class Services {
  constructor(serviceConfigurations) {
    this.overRustle = new OverRustleLogs(serviceConfigurations.overRustle);
    this.logger = logger(serviceConfigurations.logger);
    this.sql = new Sql(serviceConfigurations.sql);
    this.commandRegistry = new CommandRegistry();
    this.chatCache = new ChatCache(serviceConfigurations.cache);
  }

  prepareAsyncServices() {
    return this.sql
      .createConnection()
      .then(() => this.sql.init());
  }
}

module.exports = Services;
