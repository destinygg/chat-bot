const moment = require('moment-timezone');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function getTime(timezone, timezoneString) {
  return () =>
    new CommandOutput(
      null,
      `${moment().tz(timezone).format('HH:mm')} ${timezoneString} Steven Time (${moment()
        .tz('UTC')
        .format('HH:mm')} UTC) `,
    );
}

module.exports = (timezone, timezoneString) =>
  new Command(getTime(timezone, timezoneString), false, false, null);
