const moment = require('moment');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function getNextStreamDate(input, services) {
  return services.schedule
    .findNextStreamDay()
    .then((nextStreamDay) => {
      if (!nextStreamDay) {
        return new CommandOutput(null, `Nothing scheduled ${services.schedule.link()}`);
      }

      const { allDay, name, start, childEvent } = nextStreamDay;
      const isHappening = start.isBefore(moment());
      const startTime = start.fromNow();
      const link = services.schedule.link();
      let scheduleOutput = '';

      if (isHappening) {
        scheduleOutput = allDay
          ? `${name} is todays all-day event! ${link}`
          : `${name} is currently happening! it started ${startTime}. ${link}`;
        if (allDay && childEvent) {
          const childEventIsHappening = moment(childEvent.start).isBefore(moment());
          // prettier-ignore
          scheduleOutput = childEventIsHappening
            ? `${name} is todays all-day event! ${childEvent.name} is currently happening! it started ${childEvent.start.fromNow()}. ${link}`
            : `${name} is todays all-day event! coming up ${childEvent.start.fromNow()} is ${childEvent.name}. ${link}`;
        }
      } else {
        scheduleOutput = `${name} is coming up next! it starts ${startTime}. ${link}`;
      }

      return new CommandOutput(null, scheduleOutput);
    })
    .catch((err) => new CommandOutput(err, "Oops. Something didn't work. Check the logs."));
}

module.exports = new Command(getNextStreamDate, true, false, null);
