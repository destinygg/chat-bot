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

function registerCommandsFromFiles(commandRegistry) {
  commandRegistry.registerCommand('!stalk', stalk);
  commandRegistry.registerCommand('!logs', logs);
  commandRegistry.registerCommand('!time', time);
  commandRegistry.registerCommand('!addcommand', addCommand);
  commandRegistry.registerCommand('!deletecommand', deleteCommand);
  commandRegistry.registerCommand('!listcommands', listCommands);
  commandRegistry.registerCommand('!mute', mute);
  commandRegistry.registerCommand('!unmute', unmute);
  commandRegistry.registerCommand('!ban', ban);
  commandRegistry.registerCommand('!ipban', ipban);
  commandRegistry.registerCommand('!unban', unban);
  commandRegistry.registerCommand('!nuke', nuke);
  commandRegistry.registerCommand('!aegis', aegis);
  commandRegistry.registerCommand('!addschcmd', addschedulecommand);
  commandRegistry.registerCommand('!deleteschcmd', removeschedulecommand);
  commandRegistry.registerCommand('!song', song);
  commandRegistry.registerCommand('!earliersong', earlierSong, ['!pastsong', '!lastsong', '!previoussong']);
}

function registerCommandsFromDatabase(sql, commandRegistry, messageScheduler, logger) {
  return sql.getCommands()
    .then((commandsList) => {
      commandsList.forEach((command) => {
        if (commandRegistry.findCommand(command.cmd_key) === false) {
          commandRegistry.registerCommand(command.cmd_key,
            new Command(staticOutput(command.cmd_message), false, null, null));
        } else {
          logger.warn(`Command is hardcode but also stored in DB. Should be deleted from DB: ${command.cmd_key}`);
        }
      });
      return sql.getScheduledCommands();
    }).then((scheduledCommandList) => {
      scheduledCommandList.forEach((command) => {
        const commandToSchedule = commandRegistry.findCommand(command.cmd_key);
        if (commandToSchedule !== false) {
          messageScheduler.addScheduledCommand(command.cmd_key, commandToSchedule);
        }
      });
    });
}

module.exports = { registerCommandsFromFiles, registerCommandsFromDatabase };
