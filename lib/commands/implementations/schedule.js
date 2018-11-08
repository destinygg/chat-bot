const moment = require('moment');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function getNextStreamDate(input, services) {
  return services.schedule.findNextStreamDay()
    .then(nextStreamDay => new CommandOutput(null, `"Stream" scheduled to begin in ${moment(nextStreamDay.dateTime).fromNow()} https://destiny.gg/schedule`))
    .catch(err => new CommandOutput(err, "Oops. Something didn't work. Check the logs."))
}

module.exports = new Command(getNextStreamDate, true, false, null);
