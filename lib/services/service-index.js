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
const GoogleCal = require('./schedule.js');
const RoleCache = require('./role-cache.js');
const TempTwitchApi = require('./twitch-api');
const FakeScheduler = require('./fake-command-scheduler');

class Services {
  constructor(serviceConfigurations) {
    this.overRustle = new OverRustleLogs(serviceConfigurations.overRustle,
      serviceConfigurations.chatToConnectTo);
    this.logger = logger(serviceConfigurations.logger);
    this.sql = new Sql(serviceConfigurations.sql);
    this.commandRegistry = new CommandRegistry();
    this.chatCache = new ChatCache(serviceConfigurations.chatCache);
    this.punishmentCache = new PunishmentCache(serviceConfigurations.punishmentCache);
    this.roleCache = new RoleCache(serviceConfigurations.roleCache);
    this.punishmentStream = new PunishmentStream(this);
    this.spamDetection = new SpamDetection(serviceConfigurations.spamDetection);
    this.scheduledCommands = new ScheduledCommands(serviceConfigurations.schedule);
    this.lastfm = new LastFm(serviceConfigurations.lastFm);
    this.youtube = new YouTube(serviceConfigurations.youtube);
    this.schedule = new GoogleCal(serviceConfigurations.googleCalendar);
    this.fakeScheduler = new FakeScheduler(serviceConfigurations.schedule);
    this.tempTwitchApi = new TempTwitchApi(serviceConfigurations.twitch, this.sql, this.logger);
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
