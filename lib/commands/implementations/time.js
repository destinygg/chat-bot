const moment = require('moment-timezone');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function getLogsUrlForUser() {
  return new CommandOutput(null, `${moment().tz('America/Los_Angeles').format('HH:mm')} Pacific Steven Time`);
}

module.exports = new Command(getLogsUrlForUser, false, false, null);
