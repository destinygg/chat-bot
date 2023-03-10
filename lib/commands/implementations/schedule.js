const moment = require('moment');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function getNextStreamDate(input, services) {
  return services.schedule
    .findNextStreamDay()
    .then(
      (nextStreamDay) =>
        new CommandOutput(
          null,
          `${nextStreamDay.name}${
            nextStreamDay.allDay ? ', an all-day event,' : ''
          } scheduled to begin ${moment(
            nextStreamDay.start,
          ).fromNow()} ${services.schedule.link()}`,
        ),
    )
    .catch((err) => new CommandOutput(err, "Oops. Something didn't work. Check the logs."));
}

module.exports = new Command(getNextStreamDate, true, false, null);
