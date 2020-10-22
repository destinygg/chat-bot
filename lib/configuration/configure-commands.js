const Command = require('../commands/command-interface');
const staticOutput = require('../commands/implementations/static-output');
const stalk = require('../commands/implementations/stalk');
const time = require('../commands/implementations/time');
const addCommand = require('../commands/implementations/addcommand');
const deleteCommand = require('../commands/implementations/deletecommand');
const listCommands = require('../commands/implementations/listcommands');
const mute = require('../commands/implementations/mute');
const { ban, ipban } = require('../commands/implementations/ban');
const { unBan, unMute } = require('../commands/implementations/unban');
const { nuke, megaNuke } = require('../commands/implementations/nuke');
const aegis = require('../commands/implementations/aegis');
const addschedulecommand = require('../commands/implementations/schedulecommand');
const removeschedulecommand = require('../commands/implementations/deletescheduledCommand');
const song = require('../commands/implementations/song');
const earlierSong = require('../commands/implementations/earliersong');
const youtube = require('../commands/implementations/youtube');
const schedule = require('../commands/implementations/schedule');
const { addban, addmute } = require('../commands/implementations/banphrase');
const unbanphrase = require('../commands/implementations/unbanphrase');
const live = require('../commands/implementations/live');
const restart = require('../commands/implementations/restart');
const love = require('../commands/implementations/love');
const {
  startNewThread,
  stopQuestionSubmissions,
  getThreadInfo,
} = require('../commands/implementations/reddit-questions');
const { getDuo, updateDuo } = require('../commands/implementations/duo');
const { voteBan, voteIpban, svoteBan, svoteIpban } = require('../commands/implementations/voteban');
const { setDeaths, getDeaths, incrementDeaths } = require('../commands/implementations/deathcount');
const { gulag } = require('../commands/implementations/gulag');
const { mutelinks } = require('../commands/implementations/mutelinks');

function registerCommandsFromFiles(commandRegistry, chatConnectedTo, config) {
  commandRegistry.registerCommand('!stalk', stalk);
  commandRegistry.registerCommand('!time', time(config.timezone, config.timezoneString));
  commandRegistry.registerCommand('!addcommand', addCommand, ['!ac']);
  commandRegistry.registerCommand('!deletecommand', deleteCommand, [
    '!dc',
    '!delcommand',
    '!removecommand',
  ]);
  commandRegistry.registerCommand('!listcommands', listCommands.listCommands, ['!lc']);
  commandRegistry.registerCommand('!listscheduled', listCommands.listScheduledCommands, ['!lsc']);
  commandRegistry.registerCommand('!mute', mute, ['!mu']);
  commandRegistry.registerCommand('!unmute', unMute, ['!um', '!unm']);
  commandRegistry.registerCommand('!ban', ban);
  commandRegistry.registerCommand('!ipban', ipban, ['!ip']);
  commandRegistry.registerCommand('!unban', unBan);
  commandRegistry.registerCommand('!nuke', nuke);
  commandRegistry.registerCommand('!meganuke', megaNuke);
  commandRegistry.registerCommand('!aegis', aegis);
  commandRegistry.registerCommand('!addschcmd', addschedulecommand, ['!asc']);
  commandRegistry.registerCommand('!deleteschcmd', removeschedulecommand, ['!unschedule', '!dsc']);
  if (config.lastFm.enable) {
    commandRegistry.registerCommand('!song', song);
    commandRegistry.registerCommand('!earliersong', earlierSong, [
      '!pastsong',
      '!lastsong',
      '!previoussong',
    ]);
  }
  commandRegistry.registerCommand('!youtube', youtube, ['!video', '!lastvideo', '!yt']);
  commandRegistry.registerCommand('!schedule', schedule, ['!sch']);
  commandRegistry.registerCommand('!addban', addban);
  commandRegistry.registerCommand('!addmute', addmute);
  commandRegistry.registerCommand('!deleteban', unbanphrase, ['!deletemute', '!dmute', '!dban']);
  commandRegistry.registerCommand('!live', live);
  commandRegistry.registerCommand('!restart', restart);
  commandRegistry.registerCommand('!love', love);
  commandRegistry.registerCommand('!duo', getDuo);
  commandRegistry.registerCommand('!ud', updateDuo, ['!updateduo', '!duoupdate']);
  commandRegistry.registerCommand('!setdeaths', setDeaths, ['!setd', '!sdeaths']);
  commandRegistry.registerCommand('!incdeaths', incrementDeaths, ['!ideaths', '!incd', '!id']);
  commandRegistry.registerCommand('!deaths', getDeaths, ['!death', '!died']);
  commandRegistry.registerCommand('!mutelinks', mutelinks, [
    '!mutelink',
    '!linkmute',
    '!linksmute',
  ]);

  if (chatConnectedTo === 'dgg') {
    commandRegistry.registerCommand('!voteban', voteBan);
    commandRegistry.registerCommand('!voteipban', voteIpban);
    commandRegistry.registerCommand('!svoteban', svoteBan);
    commandRegistry.registerCommand('!svoteipban', svoteIpban);
    commandRegistry.registerCommand('!questions', getThreadInfo, [
      '!podcastquestions',
      '!dtquestions',
      '!dtsubmissions',
      '!!dtq',
    ]);
    commandRegistry.registerCommand('!newsubquestions', startNewThread, [
      '!nsq',
      '!newredditquestions',
    ]);
    commandRegistry.registerCommand('!stopsubquestions', stopQuestionSubmissions, [
      '!ssq',
      '!stopredditquestions',
    ]);
    commandRegistry.registerCommand('!gulag', gulag);
  }
}

async function setupCommandsAndCachesFromDb(
  sql,
  commandRegistry,
  messageScheduler,
  spamPunishments,
  logger,
) {
  const commandList = await sql.getCommands().catch((err) => {
    if (err.message === 'No commands found.') {
      logger.warn('No commands were loaded from database. Only hardcode commands loaded.');
      return Promise.resolve([]);
    }
    return Promise.reject(err);
  });

  commandList.forEach((command) => {
    if (commandRegistry.findCommand(command.cmd_key) === false) {
      commandRegistry.registerCommand(
        command.cmd_key,
        new Command(staticOutput(command.cmd_message), false, null, null),
      );
    } else {
      logger.warn(
        `Command is hardcode but also stored in DB. Should be deleted from DB: ${command.cmd_key}`,
      );
    }
  });

  logger.info(`Loaded ${commandList.length} commands from DB;`);

  const scheduledCommands = await sql.getScheduledCommands().catch((err) => {
    if (err.message === 'No scheduled commands found') {
      logger.warn('no scheduled commands loaded from db');
      return Promise.resolve([]);
    }
    return Promise.reject(err);
  });

  scheduledCommands.forEach((command) => {
    const commandToSchedule = commandRegistry.findCommand(command.cmd_key);
    if (commandToSchedule !== false) {
      messageScheduler.addScheduledCommand(command.cmd_key, commandToSchedule);
    }
  });

  logger.info(`Loaded ${scheduledCommands.length} scheduled commands from DB;`);

  const bannedPhrases = await sql.getAllBannedPhrases().catch((err) => {
    if (err.message === 'No banned phrases found') {
      logger.warn('No banned phrases loaded');
      return Promise.resolve([]);
    }
    return Promise.reject(err);
  });
  logger.info(`Loaded ${bannedPhrases.length} banned phrases from DB;`);

  bannedPhrases.forEach((phrase) => {
    spamPunishments.addBannedPhrase({
      text: phrase.text.toLowerCase(),
      duration: phrase.duration,
      type: phrase.type,
    });
  });
}

module.exports = { registerCommandsFromFiles, setupCommandsAndCachesFromDb };
