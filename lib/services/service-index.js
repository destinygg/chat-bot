const OverRustleLogs = require('./over-rustle-logs');
const logger = require('./logger');
const Sql = require('./sql');
const ChatCache = require('./dgg-rolling-chat-cache');
const CommandRegistry = require('./command-registry');
const PunishmentCache = require('./punishment-cache');
const PunishmentStream = require('./punishment-read-write-stream');
const SpamDetection = require('./spam-detection');
const ScheduledCommands = require('./message-scheduler');
const gulagService = require('./gulag');
const LastFm = require('./lastfm');
const YouTube = require('./youtube.js');
const GoogleCal = require('./schedule.js');
const RoleCache = require('./role-cache.js');
const TempTwitchApi = require('./twitch-api');
const TwitterApi = require('./twitter-api');
const FakeScheduler = require('./fake-command-scheduler');
const RedditVote = require('./reddit-vote');
const MessageRelay = require('./message-relay');
const messageMatchingService = require('./message-matching');
const HTMLMetadata = require('./html-metadata');

class Services {
  constructor(serviceConfigurations, chatConnectedTo) {
    this.overRustle = new OverRustleLogs(
      serviceConfigurations.overRustle,
      serviceConfigurations.chatToConnectTo,
    );
    this.logger = logger(serviceConfigurations.logger);
    this.sql = new Sql(serviceConfigurations.sql);
    this.commandRegistry = new CommandRegistry();
    this.chatCache = new ChatCache(serviceConfigurations.chatCache);
    this.punishmentCache = new PunishmentCache(serviceConfigurations.punishmentCache);
    this.roleCache = new RoleCache(serviceConfigurations.roleCache);
    this.punishmentStream = new PunishmentStream(this);
    this.spamDetection = new SpamDetection(serviceConfigurations.spamDetection);
    this.scheduledCommands = new ScheduledCommands(serviceConfigurations.schedule);
    this.gulag = gulagService;
    this.lastfm = new LastFm(serviceConfigurations.lastFm);
    this.youtube = new YouTube(serviceConfigurations.youtube);
    this.schedule = new GoogleCal(
      serviceConfigurations.googleCalendar,
      serviceConfigurations.timezone,
    );
    this.fakeScheduler = new FakeScheduler(serviceConfigurations.schedule);
    this.tempTwitchApi = new TempTwitchApi(serviceConfigurations.twitch, this.sql, this.logger);
    this.twitterApi = new TwitterApi(serviceConfigurations.twitter, this.logger);
    this.messageRelay = new MessageRelay();
    this.messageMatching = messageMatchingService;
    this.htmlMetadata = new HTMLMetadata();
    // Since reddit relies on managing a single instance of a script, it only runs on the DGG bot.
    if (chatConnectedTo === 'dgg') {
      this.redditVote = new RedditVote(serviceConfigurations.redditVote, this.logger);
    }
  }

  prepareAsyncServices() {
    return this.sql.createConnection().then(() => {
      this.sql.init();
      this.scheduledCommands.startScheduledMessages();
    });
  }
}

module.exports = Services;
