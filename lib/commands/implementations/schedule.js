const moment = require('moment');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function getNextStreamDate(input, services) {
  return services.schedule.findNextStreamDay()
    .then(nextStreamDay => new CommandOutput(null, `"Stream" scheduled to begin in 14h 11m ${moment(nextStreamDay.dateTime).fromNow()} https://destiny.gg/schedule`));
}

module.exports = new Command(getNextStreamDate, true, false, null);
