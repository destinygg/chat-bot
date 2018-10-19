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
}

function registerCommandsFromDatabase(sql, commandRegistry) {
  return sql.getStaticCommands().then((commandsList) => {
    commandsList.forEach((command) => {
      commandRegistry.registerCommand(command.cmd_key,
        new Command(staticOutput(command.cmd_message), false, null, null));
    });
  });
}

module.exports = { registerCommandsFromFiles, registerCommandsFromDatabase };
