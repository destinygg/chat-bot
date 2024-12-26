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
      let scheduleOutput = '';

      if (isHappening && allDay) {
        scheduleOutput = `${name}, an all-day event, is scheduled today.`;
        if (childEvent) {
          const childEventIsHappening = moment(childEvent.start).isBefore(moment());

          // prettier-ignore
          scheduleOutput += childEventIsHappening
            ? ` ${childEvent.name} is currently happening! It started ${childEvent.start.fromNow()}.`
            : ` Coming up ${childEvent.start.fromNow()} is ${childEvent.name}.`;
        }
      } else if (isHappening) {
        scheduleOutput = `${name} is currently happening! It started ${start.fromNow()}.`;
      } else {
        scheduleOutput = `${name} is the next scheduled event. It starts ${start.fromNow()}.`;
      }

      scheduleOutput += ` ${services.schedule.link()}`;

      return new CommandOutput(null, scheduleOutput);
    })
    .catch((err) => new CommandOutput(err, "Oops. Something didn't work. Check the logs."));
}

module.exports = new Command(getNextStreamDate, true, false, null);
