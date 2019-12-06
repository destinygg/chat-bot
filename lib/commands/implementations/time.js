const moment = require('moment-timezone');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function getLogsUrlForUser() {
  return new CommandOutput(
    null,
    `${moment()
      .tz('America/Tijuana')
      .format('HH:mm')} Pacific Steven Time (${moment()
      .tz('UTC')
      .format('HH:mm')} UTC) `,
  );
}

module.exports = new Command(getLogsUrlForUser, false, false, null);
