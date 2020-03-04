const moment = require('moment-timezone');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function getLogsUrlForUser(timezone) {
  return new CommandOutput(
    null,
    `${moment()
      .tz(timezone)
      .format('HH:mm')} Pacific Steven Time (${moment()
      .tz('UTC')
      .format('HH:mm')} UTC) `,
  );
}

module.exports = timezone => new Command(getLogsUrlForUser(timezone), false, false, null);
