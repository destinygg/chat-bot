const moment = require('moment');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function getNextStreamDate(input, services) {
  return services.schedule
    .findNextStreamDay()
    .then((nextStreamDay) => {
      if (!nextStreamDay) {
        return new CommandOutput(null, `Nothing is scheduled. ${services.schedule.link()}`);
      }

      const { allDay, name, start, childEvent } = nextStreamDay;
      const isHappening = start.isBefore(moment());
      const startTime = start.fromNow();
      const link = services.schedule.link();
      let scheduleOutput = '';

      if (isHappening) {
        scheduleOutput = allDay
          ? `${name}, an all-day event, is scheduled today. ${link}`
          : `${name} is currently happening! It started ${startTime}. ${link}`;

        if (allDay && childEvent) {
          const childEventIsHappening = moment(childEvent.start).isBefore(moment());
          // prettier-ignore
          scheduleOutput = childEventIsHappening
            ? `${name}, an all-day event, is scheduled today. ${childEvent.name} is currently happening! It started ${childEvent.start.fromNow()}. ${link}`
            : `${name}, an all-day event, is scheduled today. Coming up ${childEvent.start.fromNow()} is ${childEvent.name}. ${link}`;
        }
      } else {
        scheduleOutput = `${name} is the next scheduled event. It starts ${startTime}. ${link}`;
      }

      return new CommandOutput(null, scheduleOutput);
    })
    .catch((err) => new CommandOutput(err, "Oops. Something didn't work. Check the logs."));
}

module.exports = new Command(getNextStreamDate, true, false, null);
