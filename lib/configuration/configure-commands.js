const Command = require('../commands/command-interface');
const staticOutput = require('../commands/implementations/static-output');
const stalk = require('../commands/implementations/stalk');
const logs = require('../commands/implementations/logs');
const time = require('../commands/implementations/time');
const addCommand = require('../commands/implementations/addcommand');
const deleteCommand = require('../commands/implementations/deletecommand');
const listCommands = require('../commands/implementations/listcommands');
const mute = require('../commands/implementations/mute');
const unmute = require('../commands/implementations/unmute');
const { ban, ipban } = require('../commands/implementations/ban');
const unban = require('../commands/implementations/unban');
const nuke = require('../commands/implementations/nuke');
const aegis = require('../commands/implementations/aegis');
const addschedulecommand = require('../commands/implementations/schedulecommand');
const removeschedulecommand = require('../commands/implementations/deletescheduledCommand');
const song = require('../commands/implementations/song');
const earlierSong = require('../commands/implementations/earliersong');
const youtube = require('../commands/implementations/youtube');
const schedule = require('../commands/implementations/schedule');
const { addban, addmute } = require('../commands/implementations/banphrase');
const unbanphrase = require('../commands/implementations/unbanphrase');
const tempLive = require('../commands/implementations/templive');

function registerCommandsFromFiles(commandRegistry) {
  commandRegistry.registerCommand('!stalk', stalk);
  commandRegistry.registerCommand('!logs', logs);
  commandRegistry.registerCommand('!time', time);
  commandRegistry.registerCommand('!addcommand', addCommand);
  commandRegistry.registerCommand('!deletecommand', deleteCommand);
  commandRegistry.registerCommand('!listcommands', listCommands);
  commandRegistry.registerCommand('!mute', mute, ['!mu']);
  commandRegistry.registerCommand('!unmute', unmute);
  commandRegistry.registerCommand('!ban', ban);
  commandRegistry.registerCommand('!ipban', ipban);
  commandRegistry.registerCommand('!unban', unban);
  commandRegistry.registerCommand('!nuke', nuke);
  commandRegistry.registerCommand('!aegis', aegis);
  commandRegistry.registerCommand('!addschcmd', addschedulecommand, ['!asc']);
  commandRegistry.registerCommand('!deleteschcmd', removeschedulecommand, ['!unschedule', '!dsc']);
  commandRegistry.registerCommand('!song', song);
  commandRegistry.registerCommand('!earliersong', earlierSong, ['!pastsong', '!lastsong', '!previoussong']);
  commandRegistry.registerCommand('!youtube', youtube, ['!video', '!lastvideo', '!yt']);
  commandRegistry.registerCommand('!schedule', schedule, ['!sch']);
  commandRegistry.registerCommand('!addban', addban);
  commandRegistry.registerCommand('!addmute', addmute);
  commandRegistry.registerCommand('!deleteban', unbanphrase, ['!deletemute']);
  commandRegistry.registerCommand('!live', tempLive);
}

async function setupCommandsAndCachesFromDb(
  sql, commandRegistry, messageScheduler, spamPunishments, logger,
) {
  const commandList = await sql.getCommands().catch((err) => {
    if (err.message === 'No commands found.') {
      this.logger.warn('No commands were loaded from database. Only hardcode commands loaded.');
      return Promise.resolve([]);
    }
    return Promise.reject(err);
  });
  commandList.forEach((command) => {
    if (commandRegistry.findCommand(command.cmd_key) === false) {
      commandRegistry.registerCommand(command.cmd_key,
        new Command(staticOutput(command.cmd_message), false, null, null));
    } else {
      logger.warn(`Command is hardcode but also stored in DB. Should be deleted from DB: ${command.cmd_key}`);
    }
  });
  logger.info(`Loaded ${commandList.length} commands from DB;`);

  const scheduledCommands = await sql.getScheduledCommands()
    .catch((err) => {
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
    spamPunishments.addBannedPhrase(
      { text: phrase.text.toLowerCase(), duration: phrase.duration, type: phrase.type },
    );
  });
}


module.exports = { registerCommandsFromFiles, setupCommandsAndCachesFromDb };
