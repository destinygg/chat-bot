const moment = require('moment-timezone');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function getLogsUrlForUser() {
  return new CommandOutput(null, null, `${moment().tz('America/Winnipeg').format('HH:mm')} Central Stephen Time`);
}

module.exports = new Command(getLogsUrlForUser, false, false, null);
